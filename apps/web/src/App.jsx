import React, { useState, useEffect, useCallback } from "react";
import {
  connectWallet,
  disconnectWallet,
  createCircleOnChain,
  addMemberOnChain,
  createTaskOnChain,
  completeTaskOnChain,
  getExplorerUrl,
  formatAddress,
  isDemoMode
} from "./lib/casper.js";
import {
  upsertCircle,
  upsertTask,
  fetchTasks,
  fetchCircle,
  fetchMembers,
  upsertMember,
  fetchCircleStats
} from "./lib/api.js";

// ==================== Toast Component ====================
function Toast({ toasts, removeToast }) {
  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast ${toast.type}`}>
          <span className="toast-icon">
            {toast.type === "success" ? "✓" : toast.type === "error" ? "✕" : "ℹ"}
          </span>
          <div className="toast-content">
            <div className="toast-title">{toast.title}</div>
            {toast.message && <div className="toast-message">{toast.message}</div>}
          </div>
          <button className="btn-ghost btn-sm" onClick={() => removeToast(toast.id)}>✕</button>
        </div>
      ))}
    </div>
  );
}

// ==================== Modal Component ====================
function Modal({ isOpen, onClose, title, children, wide }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className={`modal ${wide ? 'modal-wide' : ''}`} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">{title}</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ==================== Help Modal Component ====================
function HelpModal({ isOpen, onClose, activeTab, setActiveTab }) {
  if (!isOpen) return null;

  const tabs = [
    { id: 'getting-started', label: '🚀 Getting Started', icon: '🚀' },
    { id: 'user-flows', label: '📖 User Flows', icon: '📖' },
    { id: 'shortcuts', label: '⌨️ Shortcuts', icon: '⌨️' },
    { id: 'faq', label: '❓ FAQ', icon: '❓' }
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="CareCircle Help" wide>
      <div className="help-modal-body">
        <div className="help-tabs">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`help-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="help-tab-icon">{tab.icon}</span>
              <span className="help-tab-label">{tab.label.replace(/^[^ ]+ /, '')}</span>
            </button>
          ))}
        </div>

        <div className="help-content">
          {activeTab === 'getting-started' && (
            <div className="help-section">
              <h3>Welcome to CareCircle! 💜</h3>
              <p>
                CareCircle helps families, caregivers, and volunteers coordinate caregiving tasks
                with verifiable on-chain completion proofs on the Casper blockchain.
              </p>

              <h4>Core Concepts</h4>
              <ul>
                <li><strong>Care Circles:</strong> Groups of trusted people coordinating care activities</li>
                <li><strong>Members:</strong> Caregivers who can be assigned tasks</li>
                <li><strong>Tasks:</strong> Caregiving activities with priority levels and assignments</li>
                <li><strong>On-Chain Proofs:</strong> Blockchain records proving task completion</li>
              </ul>

              <h4>Quick Start</h4>
              <ol>
                <li>Connect your Casper wallet (or use Demo Mode)</li>
                <li>Create a new circle or load an existing one (try ID: 1 for demo)</li>
                <li>Add members to your circle</li>
                <li>Create and assign tasks</li>
                <li>Complete tasks to generate on-chain proofs</li>
              </ol>

              <div className="help-callout">
                <strong>💡 First Time Here?</strong>
                <p>Try loading Circle ID <strong>1</strong> to see a demo circle with sample tasks!</p>
              </div>
            </div>
          )}

          {activeTab === 'user-flows' && (
            <div className="help-section">
              <h3>Step-by-Step Guides</h3>

              <div className="help-flow">
                <h4>🆕 Creating a New Circle</h4>
                <ol>
                  <li>Click <strong>"Connect Wallet"</strong> in the top-right corner</li>
                  <li>Approve the connection in your Casper Wallet</li>
                  <li>Click <strong>"Create New Circle"</strong> on the homepage</li>
                  <li>Enter a name (e.g., "Mom's Care Team")</li>
                  <li>Click <strong>"Create Circle"</strong></li>
                  <li>Wait for the on-chain transaction to complete</li>
                </ol>
              </div>

              <div className="help-flow">
                <h4>📂 Loading an Existing Circle</h4>
                <ol>
                  <li>Click <strong>"Load Existing Circle"</strong> on the homepage</li>
                  <li>Enter the Circle ID (get this from the circle owner)</li>
                  <li>Click <strong>"Load Circle"</strong></li>
                  <li>View tasks, members, and stats</li>
                </ol>
              </div>

              <div className="help-flow">
                <h4>👥 Adding Members</h4>
                <ol>
                  <li>Load your circle (you must be the owner)</li>
                  <li>Click <strong>"+ Add Member"</strong> in the Circle sidebar</li>
                  <li>Enter the member's Casper wallet address</li>
                  <li>Click <strong>"Add Member"</strong></li>
                  <li>The member will appear in the Members list</li>
                </ol>
              </div>

              <div className="help-flow">
                <h4>📋 Creating Tasks</h4>
                <ol>
                  <li>Load your circle</li>
                  <li>Click <strong>"+ Add Task"</strong></li>
                  <li>Enter task title (required)</li>
                  <li>Add description (optional)</li>
                  <li>Select priority: Low, Medium, High, or Urgent</li>
                  <li>Enter assignee's address (or leave blank to assign to yourself)</li>
                  <li>Click <strong>"Create Task"</strong></li>
                </ol>
              </div>

              <div className="help-flow">
                <h4>✅ Completing Tasks</h4>
                <ol>
                  <li>Find a task assigned to you (marked "Open")</li>
                  <li>Click <strong>"✓ Complete Task"</strong></li>
                  <li>Sign the transaction in your Casper Wallet</li>
                  <li>Wait for blockchain confirmation</li>
                  <li>Task will show as "Completed" with an on-chain transaction hash</li>
                </ol>
              </div>

              <div className="help-flow">
                <h4>🔍 Viewing On-Chain Proofs</h4>
                <ol>
                  <li>Look for the 🔗 icon on completed tasks or circles</li>
                  <li>Click the transaction hash link</li>
                  <li>View the transaction on Casper Testnet Explorer</li>
                  <li>Verify timestamp, signer, and transaction details</li>
                </ol>
              </div>
            </div>
          )}

          {activeTab === 'shortcuts' && (
            <div className="help-section">
              <h3>Keyboard Shortcuts</h3>
              <p>Use these shortcuts to navigate CareCircle faster:</p>

              <div className="shortcuts-list">
                <div className="shortcut-item">
                  <kbd>?</kbd>
                  <span>Toggle this help menu</span>
                </div>
                <div className="shortcut-item">
                  <kbd>Esc</kbd>
                  <span>Close any open modal</span>
                </div>
                <div className="shortcut-item">
                  <kbd>Enter</kbd>
                  <span>Submit forms (when input is focused)</span>
                </div>
              </div>

              <h4>Tips</h4>
              <ul>
                <li>Use <kbd>Tab</kbd> to navigate between form fields</li>
                <li>Press <kbd>Enter</kbd> in any input field to submit the form</li>
                <li>Click outside modals to close them</li>
              </ul>
            </div>
          )}

          {activeTab === 'faq' && (
            <div className="help-section">
              <h3>Frequently Asked Questions</h3>

              <div className="faq-item">
                <h4>What is Demo Mode?</h4>
                <p>
                  Demo Mode allows you to explore CareCircle without connecting a Casper wallet.
                  Blockchain transactions are simulated locally. To use real on-chain features,
                  connect your Casper Wallet.
                </p>
              </div>

              <div className="faq-item">
                <h4>Do I need CSPR tokens?</h4>
                <p>
                  Yes, to create circles, add members, and complete tasks on the Casper blockchain,
                  you need a small amount of CSPR for transaction fees. Use the
                  <a href="https://testnet.cspr.live/tools/faucet" target="_blank" rel="noopener noreferrer"> Testnet Faucet</a> to get free testnet CSPR.
                </p>
              </div>

              <div className="faq-item">
                <h4>Who can complete a task?</h4>
                <p>
                  Only the person assigned to a task can mark it as complete. This ensures
                  accountability and prevents unauthorized task completion.
                </p>
              </div>

              <div className="faq-item">
                <h4>Can I edit or delete tasks?</h4>
                <p>
                  Currently, tasks cannot be edited or deleted once created. This preserves the
                  integrity of the on-chain record. Future versions may add task updates with
                  version history.
                </p>
              </div>

              <div className="faq-item">
                <h4>What happens if I lose my wallet?</h4>
                <p>
                  Your wallet controls access to your circles and tasks. Always back up your
                  wallet's recovery phrase. If you lose access, you won't be able to sign
                  transactions for your circles.
                </p>
              </div>

              <div className="faq-item">
                <h4>Is my data private?</h4>
                <p>
                  Circle names, task titles, and member addresses are stored on-chain and are
                  publicly visible. Only circle members can view detailed task information in
                  the app. Avoid including sensitive personal information in task titles.
                </p>
              </div>

              <div className="faq-item">
                <h4>How do I get support?</h4>
                <p>
                  CareCircle is a hackathon project. For issues or questions, check the
                  <a href="https://github.com" target="_blank" rel="noopener noreferrer"> GitHub repository</a> or
                  <a href="https://docs.casper.network" target="_blank" rel="noopener noreferrer"> Casper documentation</a>.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}

// ==================== Loading Overlay ====================
function LoadingOverlay({ message }) {
  return (
    <div className="loading-overlay">
      <div className="loading-spinner"></div>
      <div className="loading-text">{message}</div>
    </div>
  );
}

// ==================== Stats Card ====================
function StatCard({ icon, value, label }) {
  return (
    <div className="stat-card">
      <div className="stat-icon">{icon}</div>
      <div className="stat-content">
        <div className="stat-value">{value}</div>
        <div className="stat-label">{label}</div>
      </div>
    </div>
  );
}

// ==================== Task Card ====================
function TaskCard({ task, onComplete, walletAddr, busy }) {
  const isAssignee = walletAddr?.toLowerCase() === task.assigned_to?.toLowerCase();
  const canComplete = !task.completed && isAssignee;

  const priorityLabels = ["Low", "Medium", "High", "Urgent"];
  const priorityColors = ["#71717a", "#eab308", "#f97316", "#ef4444"];

  return (
    <div className={`task-card ${task.completed ? "completed" : ""}`}>
      <div className="task-header">
        <span className="task-id">#{task.id}</span>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          {task.priority !== undefined && (
            <span
              style={{
                fontSize: "0.7rem",
                padding: "2px 8px",
                borderRadius: "9999px",
                background: `${priorityColors[task.priority]}20`,
                color: priorityColors[task.priority]
              }}
            >
              {priorityLabels[task.priority]}
            </span>
          )}
          <span className={`task-status ${task.completed ? "completed" : "open"}`}>
            {task.completed ? "✓ Completed" : "○ Open"}
          </span>
        </div>
      </div>

      <h4 className="task-title">{task.title}</h4>
      {task.description && (
        <p className="text-sm text-muted mb-4">{task.description}</p>
      )}

      <div className="task-meta">
        <div className="task-meta-item">
          <span className="label">Assigned to:</span>
          <span className="value">{formatAddress(task.assigned_to)}</span>
        </div>
        <div className="task-meta-item">
          <span className="label">Created by:</span>
          <span className="value">{formatAddress(task.created_by)}</span>
        </div>
        {task.completed_at && (
          <div className="task-meta-item">
            <span className="label">Completed:</span>
            <span className="value">{new Date(task.completed_at).toLocaleDateString()}</span>
          </div>
        )}
      </div>

      <div className="task-footer">
        <div className="task-tx">
          {task.tx_hash ? (
            <>
              <span>🔗</span>
              <a href={getExplorerUrl(task.tx_hash)} target="_blank" rel="noopener noreferrer">
                {formatAddress(task.tx_hash, 10, 8)} ↗
              </a>
            </>
          ) : (
            <span className="text-muted text-xs">No on-chain proof yet</span>
          )}
        </div>

        {canComplete && (
          <button
            className="btn btn-success btn-sm"
            onClick={() => onComplete(task)}
            disabled={busy}
          >
            {busy ? "Signing..." : "✓ Complete Task"}
          </button>
        )}

        {!task.completed && !isAssignee && walletAddr && (
          <span className="text-xs text-muted">Only assignee can complete</span>
        )}
      </div>
    </div>
  );
}

// ==================== Member Item ====================
function MemberItem({ address, isOwner, isCurrentUser }) {
  const colors = ["#6366f1", "#8b5cf6", "#ec4899", "#f43f5e", "#f97316", "#eab308", "#22c55e", "#14b8a6"];
  const colorIndex = address ? parseInt(address.slice(-2), 16) % colors.length : 0;

  return (
    <div className="member-item">
      <div className="member-avatar" style={{ background: colors[colorIndex] }}>
        {address?.slice(2, 4).toUpperCase()}
      </div>
      <div className="member-address">
        {formatAddress(address)}
        {isCurrentUser && " (you)"}
      </div>
      <span className={`member-role ${isOwner ? "owner" : ""}`}>
        {isOwner ? "Owner" : "Member"}
      </span>
    </div>
  );
}

// ==================== Main App ====================
export default function App() {
  // State
  const [walletAddr, setWalletAddr] = useState(() => {
    return localStorage.getItem("carecircle_wallet") || "";
  });
  const [circle, setCircle] = useState(null);
  const [circleName, setCircleName] = useState("");
  const [circleIdToLoad, setCircleIdToLoad] = useState("");
  const [tasks, setTasks] = useState([]);
  const [members, setMembers] = useState([]);
  const [stats, setStats] = useState({ total_tasks: 0, completed_tasks: 0, open_tasks: 0, completion_rate: 0 });
  const [filter, setFilter] = useState("all");
  const [busy, setBusy] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [toasts, setToasts] = useState([]);

  // Modal states
  const [showCreateCircle, setShowCreateCircle] = useState(false);
  const [showLoadCircle, setShowLoadCircle] = useState(false);
  const [showAddTask, setShowAddTask] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [helpTab, setHelpTab] = useState("getting-started");

  // Form states
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDescription, setNewTaskDescription] = useState("");
  const [newTaskAssignee, setNewTaskAssignee] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState(1);
  const [newMemberAddr, setNewMemberAddr] = useState("");

  // ==================== Toast Helpers ====================
  const addToast = useCallback((title, message, type = "info") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, title, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // ==================== Data Refresh ====================
  const refreshCircleData = useCallback(async (circleId) => {
    if (!circleId) return;
    try {
      const [tasksData, membersData, statsData] = await Promise.all([
        fetchTasks(circleId),
        fetchMembers(circleId),
        fetchCircleStats(circleId)
      ]);
      setTasks(tasksData);
      setMembers(membersData.map(m => ({
        address: m.address,
        isOwner: m.is_owner
      })));
      setStats(statsData);
    } catch (err) {
      console.error("Failed to refresh circle data:", err);
    }
  }, []);

  // ==================== Wallet Actions ====================
  const handleConnect = async () => {
    try {
      setBusy(true);
      setLoadingMessage("Connecting wallet...");
      const addr = await connectWallet();
      setWalletAddr(addr);
      localStorage.setItem("carecircle_wallet", addr);
      addToast("Wallet Connected", formatAddress(addr), "success");
    } catch (err) {
      addToast("Connection Failed", err.message, "error");
    } finally {
      setBusy(false);
      setLoadingMessage("");
    }
  };

  const handleDisconnect = async () => {
    await disconnectWallet();
    setWalletAddr("");
    localStorage.removeItem("carecircle_wallet");

    // Reset to base state
    setCircle(null);
    setTasks([]);
    setMembers([]);
    setStats({ total_tasks: 0, completed_tasks: 0, open_tasks: 0, completion_rate: 0 });
    localStorage.removeItem("carecircle_circle_id");

    addToast("Wallet Disconnected", "Returned to home", "info");
  };

  // ==================== Circle Actions ====================
  const handleCreateCircle = async () => {
    if (!walletAddr) return addToast("Error", "Connect wallet first", "error");
    if (!circleName.trim()) return addToast("Error", "Circle name is required", "error");

    try {
      setBusy(true);
      setLoadingMessage("Creating circle on-chain...");

      const result = await createCircleOnChain({ name: circleName });

      await upsertCircle({
        id: result.id,
        name: circleName,
        owner: walletAddr,
        tx_hash: result.txHash
      });

      // Add owner as member
      await upsertMember({
        circle_id: result.id,
        address: walletAddr,
        is_owner: true
      });

      setCircle({
        id: result.id,
        name: circleName,
        owner: walletAddr,
        txHash: result.txHash
      });

      localStorage.setItem("carecircle_circle_id", result.id.toString());

      setShowCreateCircle(false);
      setCircleName("");

      addToast("Circle Created!", `${circleName} (ID: ${result.id})`, "success");

      await refreshCircleData(result.id);
    } catch (err) {
      addToast("Failed to Create Circle", err.message, "error");
    } finally {
      setBusy(false);
      setLoadingMessage("");
    }
  };

  const handleLoadCircle = async () => {
    const id = parseInt(circleIdToLoad, 10);
    if (!id || isNaN(id)) return addToast("Error", "Enter a valid circle ID", "error");

    try {
      setBusy(true);
      setLoadingMessage("Loading circle...");

      const circleData = await fetchCircle(id);

      if (!circleData) {
        addToast("Not Found", `Circle #${id} doesn't exist`, "error");
        return;
      }

      setCircle({
        id: circleData.id,
        name: circleData.name,
        owner: circleData.owner,
        txHash: circleData.tx_hash
      });

      localStorage.setItem("carecircle_circle_id", id.toString());

      setShowLoadCircle(false);
      setCircleIdToLoad("");

      addToast("Circle Loaded!", circleData.name, "success");

      await refreshCircleData(id);
    } catch (err) {
      addToast("Failed to Load Circle", err.message, "error");
    } finally {
      setBusy(false);
      setLoadingMessage("");
    }
  };

  const handleLeaveCircle = () => {
    setCircle(null);
    setTasks([]);
    setMembers([]);
    setStats({ total_tasks: 0, completed_tasks: 0, open_tasks: 0, completion_rate: 0 });
    localStorage.removeItem("carecircle_circle_id");
    addToast("Left Circle", null, "info");
  };

  // ==================== Member Actions ====================
  const handleAddMember = async () => {
    if (!circle) return addToast("Error", "No circle loaded", "error");
    if (!newMemberAddr.trim()) return addToast("Error", "Member address is required", "error");

    try {
      setBusy(true);
      setLoadingMessage("Adding member on-chain...");

      const result = await addMemberOnChain({
        circleId: circle.id,
        memberAddress: newMemberAddr.trim()
      });

      await upsertMember({
        circle_id: circle.id,
        address: newMemberAddr.trim(),
        is_owner: false,
        tx_hash: result.txHash
      });

      setShowAddMember(false);
      setNewMemberAddr("");

      addToast("Member Added!", formatAddress(newMemberAddr), "success");
      await refreshCircleData(circle.id);
    } catch (err) {
      addToast("Failed to Add Member", err.message, "error");
    } finally {
      setBusy(false);
      setLoadingMessage("");
    }
  };

  // ==================== Task Actions ====================
  const handleCreateTask = async () => {
    if (!circle) return addToast("Error", "No circle loaded", "error");
    if (!newTaskTitle.trim()) return addToast("Error", "Task title is required", "error");

    const assignee = newTaskAssignee.trim() || walletAddr;

    try {
      setBusy(true);
      setLoadingMessage("Creating task on-chain...");

      const result = await createTaskOnChain({
        circleId: circle.id,
        title: newTaskTitle,
        assignedTo: assignee
      });

      await upsertTask({
        id: result.id,
        circle_id: circle.id,
        title: newTaskTitle,
        description: newTaskDescription || null,
        assigned_to: assignee,
        created_by: walletAddr,
        priority: newTaskPriority,
        completed: false,
        tx_hash: result.txHash
      });

      setShowAddTask(false);
      setNewTaskTitle("");
      setNewTaskDescription("");
      setNewTaskAssignee("");
      setNewTaskPriority(1);

      addToast("Task Created!", newTaskTitle, "success");
      await refreshCircleData(circle.id);
    } catch (err) {
      addToast("Failed to Create Task", err.message, "error");
    } finally {
      setBusy(false);
      setLoadingMessage("");
    }
  };

  const handleCompleteTask = async (task) => {
    if (!walletAddr) return addToast("Error", "Connect wallet first", "error");
    if (walletAddr.toLowerCase() !== task.assigned_to.toLowerCase()) {
      return addToast("Error", "Only the assignee can complete this task", "error");
    }

    try {
      setBusy(true);
      setLoadingMessage("Signing task completion...");

      const result = await completeTaskOnChain({ taskId: task.id });

      await upsertTask({
        ...task,
        completed: true,
        completed_by: walletAddr,
        completed_at: result.timestamp,
        tx_hash: result.txHash
      });

      addToast(
        "Task Completed!",
        `On-chain proof: ${formatAddress(result.txHash, 10, 8)}`,
        "success"
      );

      await refreshCircleData(circle.id);
    } catch (err) {
      addToast("Failed to Complete Task", err.message, "error");
    } finally {
      setBusy(false);
      setLoadingMessage("");
    }
  };

  // ==================== Keyboard Shortcuts ====================
  useEffect(() => {
    const handleKeyPress = (e) => {
      // Toggle help with '?' or 'Shift+/'
      if ((e.key === '?' || (e.shiftKey && e.key === '/')) && !e.target.matches('input, textarea')) {
        e.preventDefault();
        setShowHelp(prev => !prev);
      }
      // Close help with Escape
      if (e.key === 'Escape' && showHelp) {
        setShowHelp(false);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [showHelp]);

  // ==================== Effects ====================

  // Load saved circle on mount
  useEffect(() => {
    const savedCircleId = localStorage.getItem("carecircle_circle_id");
    if (savedCircleId) {
      const id = parseInt(savedCircleId, 10);
      if (!isNaN(id)) {
        fetchCircle(id).then(circleData => {
          if (circleData) {
            setCircle({
              id: circleData.id,
              name: circleData.name,
              owner: circleData.owner,
              txHash: circleData.tx_hash
            });
            refreshCircleData(id);
          }
        }).catch(console.error);
      }
    }
  }, [refreshCircleData]);

  // ==================== Filtered Data ====================
  const filteredTasks = tasks.filter((t) => {
    if (filter === "open") return !t.completed;
    if (filter === "completed") return t.completed;
    return true;
  });

  // ==================== Render ====================
  return (
    <div className="app-container">
      {/* Loading overlay */}
      {loadingMessage && <LoadingOverlay message={loadingMessage} />}

      {/* Toast notifications */}
      <Toast toasts={toasts} removeToast={removeToast} />

      {/* Floating Help Button */}
      <button
        className="help-button"
        onClick={() => setShowHelp(true)}
        title="Help (Press ? for shortcuts)"
      >
        ?
      </button>

      {/* Help Modal */}
      <HelpModal
        isOpen={showHelp}
        onClose={() => setShowHelp(false)}
        activeTab={helpTab}
        setActiveTab={setHelpTab}
      />

      {/* Header */}
      <header className="header">
        <div className="header-left">
          <div className="logo">
            <div className="logo-icon">💜</div>
            <span className="logo-text">CareCircle</span>
          </div>
          <span className="logo-badge">
            <span>◆</span> CASPER HACKATHON 2026
          </span>
          <div className="network-indicator">
            <span className={`network-dot ${isDemoMode() ? "demo" : ""}`}></span>
            {isDemoMode() ? "Demo Mode" : "Casper Testnet"}
          </div>
        </div>

        <div className="wallet-section">
          {walletAddr ? (
            <>
              <div className="wallet-info">
                <div className="wallet-label">Connected Wallet</div>
                <div className="wallet-address">{formatAddress(walletAddr)}</div>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={handleDisconnect}>
                Disconnect
              </button>
            </>
          ) : (
            <button className="btn btn-primary" onClick={handleConnect} disabled={busy}>
              Connect Wallet
            </button>
          )}
        </div>
      </header>

      {/* Hero section (when no circle) */}
      {!circle && (
        <section className="hero animate-in">
          <h1 className="hero-title">
            Caregiving, Verified<br />On-Chain
          </h1>
          <p className="hero-subtitle">
            CareCircle coordinates caregiving tasks for families, elder care, and community volunteers —
            with verifiable task completion proofs recorded on the Casper blockchain.
          </p>

          <div className="hero-features">
            <div className="hero-feature">
              <div className="hero-feature-icon">👥</div>
              <span>Create Care Circles</span>
            </div>
            <div className="hero-feature">
              <div className="hero-feature-icon">📋</div>
              <span>Assign Tasks</span>
            </div>
            <div className="hero-feature">
              <div className="hero-feature-icon">🔐</div>
              <span>Sign Completions</span>
            </div>
            <div className="hero-feature">
              <div className="hero-feature-icon">⛓️</div>
              <span>On-Chain Proofs</span>
            </div>
          </div>

          <div style={{ display: "flex", gap: "16px", justifyContent: "center", flexWrap: "wrap" }}>
            <button
              className="btn btn-primary btn-lg"
              onClick={() => setShowCreateCircle(true)}
              disabled={!walletAddr}
            >
              Create New Circle
            </button>
            <button
              className="btn btn-secondary btn-lg"
              onClick={() => setShowLoadCircle(true)}
            >
              Load Existing Circle
            </button>
          </div>

          {!walletAddr && (
            <p className="text-muted text-sm mt-4">
              Connect your Casper wallet to create a circle, or load an existing one.
            </p>
          )}

          {/* Quick demo hint */}
          <div style={{ marginTop: "40px", padding: "20px", background: "rgba(255,255,255,0.03)", borderRadius: "12px", maxWidth: "500px", margin: "40px auto 0" }}>
            <p className="text-sm text-muted" style={{ marginBottom: "8px" }}>
              <strong>🎯 Quick Demo:</strong> Click "Load Existing Circle" and enter ID <strong>1</strong> to see the demo circle with sample tasks.
            </p>
          </div>
        </section>
      )}

      {/* Main content (when circle exists) */}
      {circle && (
        <>
          {/* Stats bar */}
          <div className="stats-bar animate-in">
            <StatCard icon="📊" value={stats.total_tasks} label="Total Tasks" />
            <StatCard icon="✅" value={stats.completed_tasks} label="Completed" />
            <StatCard icon="⏳" value={stats.open_tasks} label="Open" />
            <StatCard icon="📈" value={`${stats.completion_rate}%`} label="Completion Rate" />
          </div>

          {/* Main grid */}
          <div className="main-grid">
            {/* Circle sidebar */}
            <div className="circle-card card animate-in stagger-1">
              <div className="card-header">
                <h2 className="card-title">
                  <span className="card-title-icon">🏠</span>
                  Circle
                </h2>
                <button className="btn btn-ghost btn-sm" onClick={handleLeaveCircle}>
                  Exit
                </button>
              </div>

              <div className="circle-info">
                <div className="circle-avatar">💜</div>
                <div className="circle-details">
                  <h3>{circle.name}</h3>
                  <div className="circle-meta">
                    <span>ID: {circle.id}</span>
                    <span>•</span>
                    <span>{members.length} members</span>
                  </div>
                </div>
              </div>

              {circle.txHash && (
                <div className="task-tx mb-4">
                  <span>🔗</span>
                  <a href={getExplorerUrl(circle.txHash)} target="_blank" rel="noopener noreferrer">
                    View creation tx ↗
                  </a>
                </div>
              )}

              <div className="circle-actions">
                <button
                  className="btn btn-care"
                  onClick={() => setShowAddTask(true)}
                  disabled={busy}
                >
                  + Add Task
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => setShowAddMember(true)}
                  disabled={busy || walletAddr.toLowerCase() !== circle.owner?.toLowerCase()}
                >
                  + Add Member
                </button>
              </div>

              {/* Members section */}
              <div className="members-section">
                <div className="members-header">
                  <span className="members-title">Members ({members.length})</span>
                </div>
                {members.length === 0 ? (
                  <p className="text-sm text-muted">No members loaded</p>
                ) : (
                  members.map((m, i) => (
                    <MemberItem
                      key={i}
                      address={m.address}
                      isOwner={m.isOwner}
                      isCurrentUser={m.address?.toLowerCase() === walletAddr?.toLowerCase()}
                    />
                  ))
                )}
              </div>
            </div>

            {/* Tasks section */}
            <div className="card animate-in stagger-2">
              <div className="tasks-header">
                <h2 className="card-title">
                  <span className="card-title-icon">📋</span>
                  Tasks
                </h2>

                <div className="tasks-filters">
                  <button
                    className={`filter-btn ${filter === "all" ? "active" : ""}`}
                    onClick={() => setFilter("all")}
                  >
                    All ({stats.total_tasks})
                  </button>
                  <button
                    className={`filter-btn ${filter === "open" ? "active" : ""}`}
                    onClick={() => setFilter("open")}
                  >
                    Open ({stats.open_tasks})
                  </button>
                  <button
                    className={`filter-btn ${filter === "completed" ? "active" : ""}`}
                    onClick={() => setFilter("completed")}
                  >
                    Completed ({stats.completed_tasks})
                  </button>
                </div>
              </div>

              {filteredTasks.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon">📭</div>
                  <h3>No tasks yet</h3>
                  <p>
                    {filter === "all"
                      ? "Create your first task to start coordinating care activities."
                      : filter === "open"
                        ? "All tasks have been completed! Great work."
                        : "No completed tasks yet. Complete a task to see it here."}
                  </p>
                  {filter === "all" && (
                    <button
                      className="btn btn-care mt-4"
                      onClick={() => setShowAddTask(true)}
                    >
                      + Create First Task
                    </button>
                  )}
                </div>
              ) : (
                <div className="tasks-list">
                  {filteredTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onComplete={handleCompleteTask}
                      walletAddr={walletAddr}
                      busy={busy}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Footer */}
      <footer className="footer">
        <div className="footer-content">
          <a href="https://testnet.cspr.live" target="_blank" rel="noopener noreferrer" className="footer-link">
            🔍 Casper Testnet Explorer
          </a>
          <a href="https://testnet.cspr.live/tools/faucet" target="_blank" rel="noopener noreferrer" className="footer-link">
            🚰 Testnet Faucet
          </a>
          <a href="https://docs.casper.network" target="_blank" rel="noopener noreferrer" className="footer-link">
            📚 Casper Docs
          </a>
          <a href="https://odra.dev/docs" target="_blank" rel="noopener noreferrer" className="footer-link">
            🛠️ Odra Framework
          </a>
        </div>
        <p className="footer-text">
          Built with 💜 for <a href="https://casper.network">Casper Hackathon 2026</a>
        </p>
      </footer>

      {/* ==================== Modals ==================== */}

      {/* Create Circle Modal */}
      <Modal
        isOpen={showCreateCircle}
        onClose={() => setShowCreateCircle(false)}
        title="Create Care Circle"
      >
        <div className="modal-body">
          <p className="text-muted mb-4">
            A Care Circle is a group of people coordinating caregiving activities.
            As the creator, you'll be the owner and can add members.
          </p>

          <div className="input-group">
            <label>Circle Name</label>
            <input
              className="input"
              placeholder="e.g., Mom's Care Team"
              value={circleName}
              onChange={(e) => setCircleName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreateCircle()}
            />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={() => setShowCreateCircle(false)}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={handleCreateCircle} disabled={busy}>
            {busy ? "Creating..." : "Create Circle"}
          </button>
        </div>
      </Modal>

      {/* Load Circle Modal */}
      <Modal
        isOpen={showLoadCircle}
        onClose={() => setShowLoadCircle(false)}
        title="Load Existing Circle"
      >
        <div className="modal-body">
          <p className="text-muted mb-4">
            Enter the ID of an existing circle to load it. You can find the circle ID
            from the owner or from a previous session.
          </p>

          <div className="input-group">
            <label>Circle ID</label>
            <input
              className="input"
              placeholder="e.g., 1"
              type="number"
              min="1"
              value={circleIdToLoad}
              onChange={(e) => setCircleIdToLoad(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLoadCircle()}
            />
          </div>

          <div style={{ marginTop: "16px", padding: "12px", background: "rgba(14,165,233,0.1)", borderRadius: "8px" }}>
            <p className="text-sm" style={{ color: "#0ea5e9" }}>
              💡 <strong>Try ID: 1</strong> to see the demo circle with sample data
            </p>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={() => setShowLoadCircle(false)}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={handleLoadCircle} disabled={busy}>
            {busy ? "Loading..." : "Load Circle"}
          </button>
        </div>
      </Modal>

      {/* Add Task Modal */}
      <Modal
        isOpen={showAddTask}
        onClose={() => setShowAddTask(false)}
        title="Add New Task"
      >
        <div className="modal-body">
          <div className="input-group mb-4">
            <label>Task Title *</label>
            <input
              className="input"
              placeholder="e.g., Pick up medication"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
            />
          </div>

          <div className="input-group mb-4">
            <label>Description (optional)</label>
            <input
              className="input"
              placeholder="e.g., From CVS pharmacy on Main St"
              value={newTaskDescription}
              onChange={(e) => setNewTaskDescription(e.target.value)}
            />
          </div>

          <div className="input-group mb-4">
            <label>Priority</label>
            <select
              className="input"
              value={newTaskPriority}
              onChange={(e) => setNewTaskPriority(parseInt(e.target.value))}
            >
              <option value={0}>Low</option>
              <option value={1}>Medium</option>
              <option value={2}>High</option>
              <option value={3}>Urgent</option>
            </select>
          </div>

          <div className="input-group">
            <label>Assign To (Casper Address)</label>
            <input
              className="input input-mono"
              placeholder={walletAddr || "01abc..."}
              value={newTaskAssignee}
              onChange={(e) => setNewTaskAssignee(e.target.value)}
            />
            <p className="text-xs text-muted mt-2">
              Leave empty to assign to yourself
            </p>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={() => setShowAddTask(false)}>
            Cancel
          </button>
          <button className="btn btn-care" onClick={handleCreateTask} disabled={busy}>
            {busy ? "Creating..." : "Create Task"}
          </button>
        </div>
      </Modal>

      {/* Add Member Modal */}
      <Modal
        isOpen={showAddMember}
        onClose={() => setShowAddMember(false)}
        title="Add Circle Member"
      >
        <div className="modal-body">
          <p className="text-muted mb-4">
            Add a family member, caregiver, or volunteer to your care circle.
            They'll be able to view tasks and complete assigned work.
          </p>

          <div className="input-group">
            <label>Member's Casper Address</label>
            <input
              className="input input-mono"
              placeholder="01..."
              value={newMemberAddr}
              onChange={(e) => setNewMemberAddr(e.target.value)}
            />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={() => setShowAddMember(false)}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={handleAddMember} disabled={busy}>
            {busy ? "Adding..." : "Add Member"}
          </button>
        </div>
      </Modal>
    </div>
  );
}
