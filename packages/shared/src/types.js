// Shared DTO shapes (kept simple for hackathon speed)
export const CircleDto = /**
 * @type {{
 *   id: number,
 *   name: string,
 *   owner: string
 * }}
 */ ({});

export const TaskDto = /**
 * @type {{
 *   id: number,
 *   circle_id: number,
 *   title: string,
 *   assigned_to: string,
 *   created_by: string,
 *   completed: boolean,
 *   completed_by?: string|null,
 *   completed_at?: number|null,
 *   tx_hash?: string|null
 * }}
 */ ({});
