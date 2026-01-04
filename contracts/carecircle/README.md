# CareCircle Smart Contract

Casper smart contract for the CareCircle caregiving coordination dApp.

## Overview

This contract manages:
- **Circles** - Groups of caregivers coordinating together
- **Members** - Users who belong to circles
- **Tasks** - Caregiving activities that can be assigned and completed

## Key Features

- **Verifiable Completions**: When a task is completed, the caregiver signs the transaction, creating an immutable proof on-chain
- **Event Emission**: All important actions emit events that can be tracked and verified
- **Access Control**: Only circle owners can add/remove members, only assignees can complete tasks

## Building

### Prerequisites

1. **Rust toolchain**:
   ```bash
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   rustup target add wasm32-unknown-unknown
   ```

2. **Odra CLI** (recommended):
   ```bash
   cargo install odra-cli
   ```

### Build Commands

Using Odra CLI:
```bash
odra build -b casper
```

Using Cargo:
```bash
cargo build --release --target wasm32-unknown-unknown
```

## Testing

```bash
# Run all tests
cargo test

# Run with output
cargo test -- --nocapture
```

## Contract Entry Points

### Circle Management

| Entry Point | Parameters | Description |
|-------------|------------|-------------|
| `create_circle` | `name: String` | Creates a new circle. Caller becomes owner. |
| `add_member` | `circle_id: u64, member_addr: Address` | Adds a member (owner only) |
| `remove_member` | `circle_id: u64, member_addr: Address` | Removes a member (owner only) |

### Task Management

| Entry Point | Parameters | Description |
|-------------|------------|-------------|
| `create_task` | `circle_id, title, description, assigned_to, priority` | Creates a new task |
| `complete_task` | `task_id: u64` | Marks task complete (assignee only) |
| `reassign_task` | `task_id: u64, new_assignee: Address` | Reassigns task |

### View Functions

| Entry Point | Returns | Description |
|-------------|---------|-------------|
| `get_circle` | `Option<Circle>` | Get circle details |
| `get_task` | `Option<Task>` | Get task details |
| `get_member` | `Option<Member>` | Get member details |
| `is_active_member` | `bool` | Check if address is active member |
| `get_stats` | `(u64, u64, u64)` | Get global stats |

## Events

| Event | Fields | Description |
|-------|--------|-------------|
| `CircleCreated` | `circle_id, name, owner, timestamp` | New circle created |
| `MemberAdded` | `circle_id, member, added_by, timestamp` | Member joined |
| `MemberRemoved` | `circle_id, member, removed_by, timestamp` | Member left |
| `TaskCreated` | `task_id, circle_id, title, assigned_to, created_by, timestamp` | Task created |
| `TaskCompleted` | `task_id, circle_id, completed_by, timestamp` | **Verifiable proof!** |
| `TaskReassigned` | `task_id, old_assignee, new_assignee, reassigned_by, timestamp` | Task reassigned |

## Data Structures

### Circle
```rust
pub struct Circle {
    pub id: u64,
    pub name: String,
    pub owner: Address,
    pub created_at: u64,
    pub member_count: u64,
    pub task_count: u64,
}
```

### Task
```rust
pub struct Task {
    pub id: u64,
    pub circle_id: u64,
    pub title: String,
    pub description: String,
    pub assigned_to: Address,
    pub created_by: Address,
    pub created_at: u64,
    pub completed: bool,
    pub completed_by: Option<Address>,
    pub completed_at: Option<u64>,
    pub priority: u8, // 0=low, 1=medium, 2=high, 3=urgent
}
```

### Member
```rust
pub struct Member {
    pub circle_id: u64,
    pub address: Address,
    pub joined_at: u64,
    pub tasks_completed: u64,
    pub is_active: bool,
}
```

## Deployment

See the main project README for deployment instructions, or use:

```bash
cd ../..
./scripts/deploy-contract.sh
```

## License

MIT
