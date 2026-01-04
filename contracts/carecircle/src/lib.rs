#![no_std]
extern crate alloc;

use alloc::string::String;
use alloc::vec::Vec;
use odra::prelude::*;
use odra::{Mapping, Var};

// ==================== Data Structures ====================

/// Represents a care circle - a group of people coordinating caregiving tasks
#[derive(Clone, Debug, OdraType)]
pub struct Circle {
    pub id: u64,
    pub name: String,
    pub owner: Address,
    pub created_at: u64,
    pub member_count: u64,
    pub task_count: u64,
}

/// Represents a caregiving task within a circle
#[derive(Clone, Debug, OdraType)]
pub struct Task {
    pub id: u64,
    pub circle_id: u64,
    pub title: String,
    pub assigned_to: Address,
    pub created_by: Address,
    pub created_at: u64,
    pub completed: bool,
    pub completed_at: u64, // 0 if not completed
    pub priority: u8,
}

// ==================== Events ====================

/// Emitted when a new circle is created
#[derive(OdraEvent)]
pub struct CircleCreated {
    pub circle_id: u64,
    pub name: String,
    pub owner: Address,
}

/// Emitted when a member is added to a circle
#[derive(OdraEvent)]
pub struct MemberAdded {
    pub circle_id: u64,
    pub member: Address,
    pub added_by: Address,
}

/// Emitted when a new task is created
#[derive(OdraEvent)]
pub struct TaskCreated {
    pub task_id: u64,
    pub circle_id: u64,
    pub title: String,
    pub assigned_to: Address,
}

/// Emitted when a task is completed - this is the verifiable proof!
#[derive(OdraEvent)]
pub struct TaskCompleted {
    pub task_id: u64,
    pub circle_id: u64,
    pub completed_by: Address,
    pub timestamp: u64,
}

// ==================== Contract Module ====================

#[odra::module(events = [CircleCreated, MemberAdded, TaskCreated, TaskCompleted])]
pub struct CareCircle {
    // Counters
    next_circle_id: Var<u64>,
    next_task_id: Var<u64>,
    
    // Circle storage
    circles: Mapping<u64, Circle>,
    
    // Member storage: (circle_id, member_index) -> Address
    // We use a count + index pattern for simplicity
    circle_member_count: Mapping<u64, u64>,
    circle_members: Mapping<(u64, u64), Address>,
    
    // Is member check: (circle_id, address) -> bool
    is_member: Mapping<(u64, Address), bool>,
    
    // Task storage
    tasks: Mapping<u64, Task>,
    
    // Circle task count
    circle_task_count: Mapping<u64, u64>,
    
    // Stats
    total_circles: Var<u64>,
    total_tasks: Var<u64>,
    total_completions: Var<u64>,
}

#[odra::module]
impl CareCircle {
    /// Initialize the contract
    #[odra(init)]
    pub fn init(&mut self) {
        self.next_circle_id.set(1);
        self.next_task_id.set(1);
        self.total_circles.set(0);
        self.total_tasks.set(0);
        self.total_completions.set(0);
    }

    // ==================== Circle Management ====================

    /// Create a new care circle
    /// The caller becomes the owner and first member
    pub fn create_circle(&mut self, name: String) -> u64 {
        let env = self.env();
        let owner = env.caller();
        let timestamp = env.get_block_time();
        
        let id = self.next_circle_id.get_or_default();
        self.next_circle_id.set(id + 1);

        let circle = Circle {
            id,
            name: name.clone(),
            owner,
            created_at: timestamp,
            member_count: 1,
            task_count: 0,
        };

        // Store circle
        self.circles.set(&id, circle);
        
        // Add owner as first member
        self.circle_member_count.set(&id, 1);
        self.circle_members.set(&(id, 0), owner);
        self.is_member.set(&(id, owner), true);
        
        // Update stats
        self.total_circles.set(self.total_circles.get_or_default() + 1);

        // Emit event
        self.env().emit_event(CircleCreated {
            circle_id: id,
            name,
            owner,
        });

        id
    }

    /// Add a member to a circle (only owner can add)
    pub fn add_member(&mut self, circle_id: u64, member_addr: Address) {
        let env = self.env();
        let caller = env.caller();

        // Get circle and verify caller is owner
        let mut circle = self.circles.get(&circle_id)
            .expect("Circle not found");
        
        if caller != circle.owner {
            env.revert(OdraError::user(1)); // Not owner
        }
        
        // Check if already a member
        if self.is_member.get(&(circle_id, member_addr)).unwrap_or(false) {
            env.revert(OdraError::user(2)); // Already member
        }

        // Add member
        let member_idx = self.circle_member_count.get(&circle_id).unwrap_or(0);
        self.circle_members.set(&(circle_id, member_idx), member_addr);
        self.circle_member_count.set(&circle_id, member_idx + 1);
        self.is_member.set(&(circle_id, member_addr), true);
        
        // Update circle member count
        circle.member_count += 1;
        self.circles.set(&circle_id, circle);

        // Emit event
        self.env().emit_event(MemberAdded {
            circle_id,
            member: member_addr,
            added_by: caller,
        });
    }

    // ==================== Task Management ====================

    /// Create a new task in a circle
    pub fn create_task(
        &mut self,
        circle_id: u64,
        title: String,
        assigned_to: Address,
        priority: u8,
    ) -> u64 {
        let env = self.env();
        let caller = env.caller();
        let timestamp = env.get_block_time();

        // Verify caller is a member
        if !self.is_member.get(&(circle_id, caller)).unwrap_or(false) {
            env.revert(OdraError::user(3)); // Not a member
        }
        
        // Verify assignee is a member
        if !self.is_member.get(&(circle_id, assigned_to)).unwrap_or(false) {
            env.revert(OdraError::user(4)); // Assignee not a member
        }

        let id = self.next_task_id.get_or_default();
        self.next_task_id.set(id + 1);

        let task = Task {
            id,
            circle_id,
            title: title.clone(),
            assigned_to,
            created_by: caller,
            created_at: timestamp,
            completed: false,
            completed_at: 0,
            priority,
        };

        // Store task
        self.tasks.set(&id, task);
        
        // Update circle task count
        let task_count = self.circle_task_count.get(&circle_id).unwrap_or(0);
        self.circle_task_count.set(&circle_id, task_count + 1);
        
        // Update circle
        let mut circle = self.circles.get(&circle_id).expect("Circle not found");
        circle.task_count += 1;
        self.circles.set(&circle_id, circle);
        
        // Update stats
        self.total_tasks.set(self.total_tasks.get_or_default() + 1);

        // Emit event
        self.env().emit_event(TaskCreated {
            task_id: id,
            circle_id,
            title,
            assigned_to,
        });

        id
    }

    /// Complete a task - creates verifiable on-chain proof!
    pub fn complete_task(&mut self, task_id: u64) {
        let env = self.env();
        let caller = env.caller();
        let timestamp = env.get_block_time();

        let mut task = self.tasks.get(&task_id)
            .expect("Task not found");
        
        if task.completed {
            env.revert(OdraError::user(5)); // Already completed
        }
        
        if caller != task.assigned_to {
            env.revert(OdraError::user(6)); // Not assignee
        }

        // Mark as completed
        task.completed = true;
        task.completed_at = timestamp;
        self.tasks.set(&task_id, task.clone());
        
        // Update global stats
        self.total_completions.set(self.total_completions.get_or_default() + 1);

        // Emit event - THIS IS THE VERIFIABLE PROOF!
        self.env().emit_event(TaskCompleted {
            task_id,
            circle_id: task.circle_id,
            completed_by: caller,
            timestamp,
        });
    }

    // ==================== View Functions ====================

    /// Get circle details
    pub fn get_circle(&self, circle_id: u64) -> Option<Circle> {
        self.circles.get(&circle_id)
    }

    /// Get task details
    pub fn get_task(&self, task_id: u64) -> Option<Task> {
        self.tasks.get(&task_id)
    }

    /// Check if address is a member of a circle
    pub fn check_is_member(&self, circle_id: u64, addr: Address) -> bool {
        self.is_member.get(&(circle_id, addr)).unwrap_or(false)
    }

    /// Get member count for a circle
    pub fn get_member_count(&self, circle_id: u64) -> u64 {
        self.circle_member_count.get(&circle_id).unwrap_or(0)
    }

    /// Get task count for a circle
    pub fn get_task_count(&self, circle_id: u64) -> u64 {
        self.circle_task_count.get(&circle_id).unwrap_or(0)
    }

    /// Get global statistics
    pub fn get_stats(&self) -> (u64, u64, u64) {
        (
            self.total_circles.get_or_default(),
            self.total_tasks.get_or_default(),
            self.total_completions.get_or_default(),
        )
    }
}
