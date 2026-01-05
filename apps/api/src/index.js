import express from "express";
import cors from "cors";
import { z } from "zod";
import swaggerUi from "swagger-ui-express";
import swaggerJsdoc from "swagger-jsdoc";
import { openDb } from "./db.js";
import { seed } from "./seed.js";

const app = express();
app.use(cors());
app.use(express.json());

const db = openDb(process.env.DB_FILE || "carecircle.db");

// ==================== Swagger Setup ====================

const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "CareCircle API",
      version: "1.0.0",
      description: `
## CareCircle on Casper - Verifiable Caregiving Coordination

Backend API for the CareCircle dApp built for **Casper Hackathon 2026**.

CareCircle enables families, caregivers, and volunteers to coordinate caregiving tasks 
with **verifiable task completion proofs** recorded on the Casper blockchain.

### Key Features
- 🏠 **Circles**: Create caregiving groups for families or communities
- 👥 **Members**: Add caregivers and volunteers to circles
- ✅ **Tasks**: Assign, track, and complete caregiving tasks
- ⛓️ **On-Chain Verification**: Task completions are recorded on Casper Testnet

### Architecture
- **Frontend**: React + Vite (http://localhost:5173)
- **API**: Express.js cache layer (this service)
- **Blockchain**: Casper Testnet via CSPR.click SDK
- **Smart Contract**: Odra framework (Rust)

### Links
- [Casper Testnet Explorer](https://testnet.cspr.live)
- [Casper Documentation](https://docs.casper.network)
- [Odra Framework](https://odra.dev/docs)
      `,
      contact: {
        name: "CareCircle Team",
        url: "https://github.com/carecircle/casper"
      },
      license: {
        name: "MIT",
        url: "https://opensource.org/licenses/MIT"
      }
    },
    servers: [
      {
        url: "http://localhost:3005",
        description: "Local Development Server"
      }
    ],
    tags: [
      { name: "Health", description: "Service health endpoints" },
      { name: "Circles", description: "Caregiving circle management" },
      { name: "Members", description: "Circle member management" },
      { name: "Tasks", description: "Task assignment and completion" },
      { name: "Stats", description: "Analytics and statistics" }
    ]
  },
  apis: ["./src/index.js"]
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: "CareCircle API Documentation"
}));

// ==================== Root & Health Check ====================

/**
 * @swagger
 * /:
 *   get:
 *     summary: API Information
 *     description: Returns basic API information and available endpoints
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: API information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 name:
 *                   type: string
 *                   example: CareCircle API
 *                 version:
 *                   type: string
 *                   example: 1.0.0
 *                 docs:
 *                   type: string
 *                   example: http://localhost:3005/docs
 */
app.get("/", (_, res) => res.json({
  name: "CareCircle API",
  version: "1.0.0",
  description: "Backend API for CareCircle on Casper - Verifiable Caregiving Coordination",
  docs: "http://localhost:3005/docs",
  frontend: "http://localhost:5173"
}));

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health Check
 *     description: Check if the API service is running
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: true
 *                 service:
 *                   type: string
 *                   example: CareCircle API
 *                 version:
 *                   type: string
 *                   example: 1.0.0
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 */
app.get("/health", (_, res) => res.json({
  ok: true,
  service: "CareCircle API",
  version: "1.0.0",
  timestamp: new Date().toISOString()
}));

// ==================== Circle Endpoints ====================

/**
 * @swagger
 * /circles/upsert:
 *   post:
 *     summary: Create or update a circle
 *     description: Upserts a caregiving circle. The API acts as a fast cache; the blockchain is the source of truth.
 *     tags: [Circles]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [id, name, owner]
 *             properties:
 *               id:
 *                 type: integer
 *                 description: Circle ID (from blockchain)
 *                 example: 1
 *               name:
 *                 type: string
 *                 description: Circle name
 *                 example: "Mom's Care Team"
 *               owner:
 *                 type: string
 *                 description: Owner's Casper public key
 *                 example: "01a5b8c9d0e1f234567890abcdef1234567890abcdef1234567890abcdef1234"
 *               tx_hash:
 *                 type: string
 *                 nullable: true
 *                 description: Transaction hash of circle creation
 *     responses:
 *       200:
 *         description: Circle upserted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                 id:
 *                   type: integer
 *       400:
 *         description: Validation error
 */
app.post("/circles/upsert", (req, res) => {
  try {
    const schema = z.object({
      id: z.number().int().positive(),
      name: z.string().min(1),
      owner: z.string().min(1),
      tx_hash: z.string().nullable().optional()
    });
    const input = schema.parse(req.body);

    db.prepare(`
      INSERT INTO circles(id, name, owner, tx_hash, created_at) 
      VALUES(?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET 
        name=excluded.name, 
        owner=excluded.owner,
        tx_hash=COALESCE(excluded.tx_hash, tx_hash)
    `).run(input.id, input.name, input.owner, input.tx_hash ?? null, Date.now());

    res.json({ ok: true, id: input.id });
  } catch (err) {
    console.error("Error upserting circle:", err);
    res.status(400).json({ error: err.message });
  }
});

/**
 * @swagger
 * /circles/{id}:
 *   get:
 *     summary: Get circle by ID
 *     description: Retrieves a single caregiving circle by its ID
 *     tags: [Circles]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Circle ID
 *     responses:
 *       200:
 *         description: Circle data or null if not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 name:
 *                   type: string
 *                 owner:
 *                   type: string
 *                 tx_hash:
 *                   type: string
 *                   nullable: true
 *                 created_at:
 *                   type: integer
 */
app.get("/circles/:id", (req, res) => {
  const id = Number(req.params.id);
  const circle = db.prepare("SELECT * FROM circles WHERE id=?").get(id);
  res.json(circle ?? null);
});

/**
 * @swagger
 * /circles/owner/{address}:
 *   get:
 *     summary: Get circles by owner
 *     description: Retrieves all circles owned by a specific address
 *     tags: [Circles]
 *     parameters:
 *       - in: path
 *         name: address
 *         required: true
 *         schema:
 *           type: string
 *         description: Owner's Casper public key
 *     responses:
 *       200:
 *         description: Array of circles
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   name:
 *                     type: string
 *                   owner:
 *                     type: string
 */
app.get("/circles/owner/:address", (req, res) => {
  const address = req.params.address;
  const circles = db.prepare("SELECT * FROM circles WHERE owner=? ORDER BY created_at DESC").all(address);
  res.json(circles);
});

// ==================== Member Endpoints ====================

/**
 * @swagger
 * /members/upsert:
 *   post:
 *     summary: Add or update a member
 *     description: Adds a caregiver or volunteer to a circle
 *     tags: [Members]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [circle_id, address]
 *             properties:
 *               circle_id:
 *                 type: integer
 *                 example: 1
 *               address:
 *                 type: string
 *                 description: Member's Casper public key
 *               is_owner:
 *                 type: boolean
 *                 default: false
 *               tx_hash:
 *                 type: string
 *                 nullable: true
 *     responses:
 *       200:
 *         description: Member added successfully
 *       400:
 *         description: Validation error
 */
app.post("/members/upsert", (req, res) => {
  try {
    const schema = z.object({
      circle_id: z.number().int().positive(),
      address: z.string().min(1),
      is_owner: z.boolean().optional(),
      tx_hash: z.string().nullable().optional()
    });
    const input = schema.parse(req.body);

    db.prepare(`
      INSERT INTO members(circle_id, address, is_owner, tx_hash, joined_at)
      VALUES(?, ?, ?, ?, ?)
      ON CONFLICT(circle_id, address) DO UPDATE SET
        is_owner=excluded.is_owner,
        tx_hash=COALESCE(excluded.tx_hash, tx_hash)
    `).run(
      input.circle_id,
      input.address,
      input.is_owner ? 1 : 0,
      input.tx_hash ?? null,
      Date.now()
    );

    res.json({ ok: true });
  } catch (err) {
    console.error("Error upserting member:", err);
    res.status(400).json({ error: err.message });
  }
});

/**
 * @swagger
 * /circles/{id}/members:
 *   get:
 *     summary: Get circle members
 *     description: Retrieves all members of a caregiving circle
 *     tags: [Members]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Circle ID
 *     responses:
 *       200:
 *         description: Array of members
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   circle_id:
 *                     type: integer
 *                   address:
 *                     type: string
 *                   is_owner:
 *                     type: boolean
 *                   tx_hash:
 *                     type: string
 *                     nullable: true
 *                   joined_at:
 *                     type: integer
 */
app.get("/circles/:id/members", (req, res) => {
  const id = Number(req.params.id);
  const members = db.prepare("SELECT * FROM members WHERE circle_id=? ORDER BY is_owner DESC, joined_at ASC").all(id);
  res.json(members.map(m => ({
    ...m,
    is_owner: !!m.is_owner
  })));
});

// ==================== Task Endpoints ====================

/**
 * @swagger
 * /tasks/upsert:
 *   post:
 *     summary: Create or update a task
 *     description: Upserts a caregiving task with assignment and completion data
 *     tags: [Tasks]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [id, circle_id, title, assigned_to, created_by, completed]
 *             properties:
 *               id:
 *                 type: integer
 *                 example: 1
 *               circle_id:
 *                 type: integer
 *                 example: 1
 *               title:
 *                 type: string
 *                 example: "Doctor appointment accompaniment"
 *               description:
 *                 type: string
 *                 nullable: true
 *                 example: "Drive to and attend the 2pm cardiology appointment"
 *               assigned_to:
 *                 type: string
 *                 description: Assignee's Casper public key
 *               created_by:
 *                 type: string
 *                 description: Creator's Casper public key
 *               priority:
 *                 type: integer
 *                 minimum: 0
 *                 maximum: 3
 *                 default: 1
 *                 description: "0=Low, 1=Normal, 2=High, 3=Urgent"
 *               completed:
 *                 type: boolean
 *               completed_by:
 *                 type: string
 *                 nullable: true
 *               completed_at:
 *                 type: integer
 *                 nullable: true
 *                 description: Unix timestamp of completion
 *               tx_hash:
 *                 type: string
 *                 nullable: true
 *                 description: Transaction hash of task completion on Casper
 *     responses:
 *       200:
 *         description: Task upserted successfully
 *       400:
 *         description: Validation error
 */
app.post("/tasks/upsert", (req, res) => {
  try {
    const schema = z.object({
      id: z.number().int().positive(),
      circle_id: z.number().int().positive(),
      title: z.string().min(1),
      description: z.string().nullable().optional(),
      assigned_to: z.string().min(1),
      created_by: z.string().min(1),
      priority: z.number().int().min(0).max(3).optional(),
      completed: z.boolean(),
      completed_by: z.string().nullable().optional(),
      completed_at: z.number().int().nullable().optional(),
      tx_hash: z.string().nullable().optional()
    });
    const t = schema.parse(req.body);

    db.prepare(`
      INSERT INTO tasks(id, circle_id, title, description, assigned_to, created_by, priority, completed, completed_by, completed_at, tx_hash, created_at)
      VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        title=excluded.title,
        description=excluded.description,
        assigned_to=excluded.assigned_to,
        created_by=excluded.created_by,
        priority=excluded.priority,
        completed=excluded.completed,
        completed_by=excluded.completed_by,
        completed_at=excluded.completed_at,
        tx_hash=COALESCE(excluded.tx_hash, tx_hash)
    `).run(
      t.id,
      t.circle_id,
      t.title,
      t.description ?? null,
      t.assigned_to,
      t.created_by,
      t.priority ?? 1,
      t.completed ? 1 : 0,
      t.completed_by ?? null,
      t.completed_at ?? null,
      t.tx_hash ?? null,
      Date.now()
    );

    res.json({ ok: true, id: t.id });
  } catch (err) {
    console.error("Error upserting task:", err);
    res.status(400).json({ error: err.message });
  }
});

/**
 * @swagger
 * /circles/{id}/tasks:
 *   get:
 *     summary: Get circle tasks
 *     description: Retrieves all tasks for a caregiving circle
 *     tags: [Tasks]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Circle ID
 *     responses:
 *       200:
 *         description: Array of tasks sorted by status and priority
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   circle_id:
 *                     type: integer
 *                   title:
 *                     type: string
 *                   description:
 *                     type: string
 *                     nullable: true
 *                   assigned_to:
 *                     type: string
 *                   completed:
 *                     type: boolean
 *                   tx_hash:
 *                     type: string
 *                     nullable: true
 *                     description: On-chain verification hash
 */
app.get("/circles/:id/tasks", (req, res) => {
  const id = Number(req.params.id);
  const tasks = db.prepare("SELECT * FROM tasks WHERE circle_id=? ORDER BY completed ASC, priority DESC, id DESC").all(id);
  // Normalize types for UI
  res.json(tasks.map(t => ({
    ...t,
    completed: !!t.completed
  })));
});

/**
 * @swagger
 * /tasks/{id}:
 *   get:
 *     summary: Get task by ID
 *     description: Retrieves a single task by its ID
 *     tags: [Tasks]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Task ID
 *     responses:
 *       200:
 *         description: Task data or null if not found
 */
app.get("/tasks/:id", (req, res) => {
  const id = Number(req.params.id);
  const task = db.prepare("SELECT * FROM tasks WHERE id=?").get(id);
  if (task) {
    task.completed = !!task.completed;
  }
  res.json(task ?? null);
});

/**
 * @swagger
 * /tasks/assigned/{address}:
 *   get:
 *     summary: Get tasks by assignee
 *     description: Retrieves all tasks assigned to a specific address
 *     tags: [Tasks]
 *     parameters:
 *       - in: path
 *         name: address
 *         required: true
 *         schema:
 *           type: string
 *         description: Assignee's Casper public key
 *     responses:
 *       200:
 *         description: Array of assigned tasks
 */
app.get("/tasks/assigned/:address", (req, res) => {
  const address = req.params.address;
  const tasks = db.prepare("SELECT * FROM tasks WHERE assigned_to=? ORDER BY completed ASC, priority DESC, id DESC").all(address);
  res.json(tasks.map(t => ({
    ...t,
    completed: !!t.completed
  })));
});

// ==================== Stats Endpoints ====================

/**
 * @swagger
 * /circles/{id}/stats:
 *   get:
 *     summary: Get circle statistics
 *     description: Retrieves task and member statistics for a circle
 *     tags: [Stats]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Circle ID
 *     responses:
 *       200:
 *         description: Circle statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total_tasks:
 *                   type: integer
 *                   example: 10
 *                 completed_tasks:
 *                   type: integer
 *                   example: 6
 *                 open_tasks:
 *                   type: integer
 *                   example: 4
 *                 completion_rate:
 *                   type: integer
 *                   description: Percentage 0-100
 *                   example: 60
 *                 member_count:
 *                   type: integer
 *                   example: 3
 */
app.get("/circles/:id/stats", (req, res) => {
  const id = Number(req.params.id);

  const totalTasks = db.prepare("SELECT COUNT(*) as count FROM tasks WHERE circle_id=?").get(id)?.count || 0;
  const completedTasks = db.prepare("SELECT COUNT(*) as count FROM tasks WHERE circle_id=? AND completed=1").get(id)?.count || 0;
  const memberCount = db.prepare("SELECT COUNT(*) as count FROM members WHERE circle_id=?").get(id)?.count || 0;

  res.json({
    total_tasks: totalTasks,
    completed_tasks: completedTasks,
    open_tasks: totalTasks - completedTasks,
    completion_rate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
    member_count: memberCount
  });
});

/**
 * @swagger
 * /stats:
 *   get:
 *     summary: Get global statistics
 *     description: Retrieves platform-wide statistics
 *     tags: [Stats]
 *     responses:
 *       200:
 *         description: Global platform statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total_circles:
 *                   type: integer
 *                 total_tasks:
 *                   type: integer
 *                 completed_tasks:
 *                   type: integer
 *                 total_members:
 *                   type: integer
 */
app.get("/stats", (_, res) => {
  const totalCircles = db.prepare("SELECT COUNT(*) as count FROM circles").get()?.count || 0;
  const totalTasks = db.prepare("SELECT COUNT(*) as count FROM tasks").get()?.count || 0;
  const completedTasks = db.prepare("SELECT COUNT(*) as count FROM tasks WHERE completed=1").get()?.count || 0;
  const totalMembers = db.prepare("SELECT COUNT(DISTINCT address) as count FROM members").get()?.count || 0;

  res.json({
    total_circles: totalCircles,
    total_tasks: totalTasks,
    completed_tasks: completedTasks,
    total_members: totalMembers
  });
});

// ==================== Error Handler ====================

app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
});

// ==================== Start Server ====================

const port = Number(process.env.PORT || 3005);
app.listen(port, () => {
  // Auto-seed database if empty (for demo purposes)
  const circleCount = db.prepare("SELECT COUNT(*) as count FROM circles").get()?.count || 0;
  if (circleCount === 0) {
    console.log("📦 Database is empty, seeding with demo data...");
    seed(db);
  }

  console.log(`
╔═══════════════════════════════════════════════════════════════╗
║  CareCircle API Server                                        ║
║  Casper Hackathon 2026                                        ║
╠═══════════════════════════════════════════════════════════════╣
║  Status:  Running                                             ║
║  URL:     http://localhost:${port.toString().padEnd(37)}║
║  Health:  http://localhost:${port}/health${" ".repeat(27)}║
╚═══════════════════════════════════════════════════════════════╝
  `);
});
