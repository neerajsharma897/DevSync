Okay, this is the right call. Here's everything stripped down to exactly what a 3-person final year project needs — nothing more.

---

## Roles — Only These Matter

**Workspace level** (stored in `workspace_members.role`):

| Role | What they can do |
|---|---|
| `owner` | Everything. Delete workspace, manage all settings, all permissions. |
| `admin` | Invite/remove members, manage channels, manage projects. Cannot delete workspace. |
| `member` | Create tasks, post messages, join channels. Default role. |

**Project level** (stored in `project_members.role`):

| Role | What they can do |
|---|---|
| `project_admin` | Manage project settings, create/close sprints, manage members. |
| `developer` | Create/edit/transition tasks, comment, log work. Core team role. |
| `viewer` | Read only. See tasks and messages, cannot create or edit. |

That's 6 roles total. Everything else in the PDF (scrum_master, reporter, guest, bot, channel_manager) is real-world complexity you do not need.

---

## Schema — Only These Tables (18 total)

### Auth (2 tables)

```sql
users
  user_id        UUID PK
  email          VARCHAR(255) UNIQUE NOT NULL
  full_name      VARCHAR(255) NOT NULL
  display_name   VARCHAR(80)
  avatar_url     TEXT 
  github_id      VARCHAR(64) UNIQUE
  github_login   VARCHAR(64)
  google_id      VARCHAR(64) UNIQUE
  password_hash  TEXT
  presence       VARCHAR(20) DEFAULT 'offline'
  last_active_at TIMESTAMPTZ
  created_at     TIMESTAMPTZ DEFAULT NOW()
  updated_at     TIMESTAMPTZ DEFAULT NOW()
  deleted_at     TIMESTAMPTZ

refresh_tokens
  token_id     UUID PK
  user_id      UUID FK → users
  token_hash   VARCHAR(64) UNIQUE NOT NULL
  device_info  JSONB
  issued_at    TIMESTAMPTZ DEFAULT NOW()
  expires_at   TIMESTAMPTZ NOT NULL
  revoked_at   TIMESTAMPTZ
```

---

### Workspace (2 tables)

```sql
workspaces
  workspace_id  UUID PK
  name          VARCHAR(100) NOT NULL
  slug          VARCHAR(50) UNIQUE NOT NULL
  icon_url      TEXT
  description   TEXT
  owner_id      UUID FK → users
  created_at    TIMESTAMPTZ DEFAULT NOW()
  updated_at    TIMESTAMPTZ DEFAULT NOW()
  deleted_at    TIMESTAMPTZ

workspace_members
  id            UUID PK
  workspace_id  UUID FK → workspaces
  user_id       UUID FK → users
  role          VARCHAR(20) NOT NULL   -- owner|admin|member
  invited_by    UUID FK → users
  joined_at     TIMESTAMPTZ DEFAULT NOW()
  state         VARCHAR(20) DEFAULT 'active'  -- active|invited|deactivated
  UNIQUE(workspace_id, user_id)
```

---

### Projects (2 tables)

```sql
projects
  project_id        UUID PK
  workspace_id      UUID FK → workspaces
  name              VARCHAR(100) NOT NULL
  key               VARCHAR(10) NOT NULL     -- e.g. "PROJ", immutable
  description       TEXT
  icon_url          TEXT
  lead_user_id      UUID FK → users
  github_repo_owner VARCHAR(100)
  github_repo_name  VARCHAR(200)
  github_webhook_secret VARCHAR(128)         -- encrypted HMAC secret
  issue_counter     INTEGER DEFAULT 0        -- for PROJ-1, PROJ-2...
  status            VARCHAR(20) DEFAULT 'active'  -- active|archived
  created_at        TIMESTAMPTZ DEFAULT NOW()
  updated_at        TIMESTAMPTZ DEFAULT NOW()
  UNIQUE(workspace_id, key)

project_members
  id          UUID PK
  project_id  UUID FK → projects
  user_id     UUID FK → users
  role        VARCHAR(30) NOT NULL   -- project_admin|developer|viewer
  added_by    UUID FK → users
  added_at    TIMESTAMPTZ DEFAULT NOW()
  UNIQUE(project_id, user_id)
```

---

### Tasks (1 table)

```sql
tasks
  task_id              UUID PK
  task_key             VARCHAR(20) NOT NULL      -- e.g. "PROJ-42", immutable
  project_id           UUID FK → projects
  parent_task_id       UUID FK → tasks           -- for subtasks, NULL = top-level
  epic_id              UUID FK → tasks           -- which epic, NULL if not under epic
  sprint_id            UUID FK → sprints         -- current sprint, nullable
  title                VARCHAR(500) NOT NULL
  description          JSONB DEFAULT '{}'        -- Tiptap JSON
  description_text     TEXT DEFAULT ''           -- plain text for search
  description_tsv      TSVECTOR GENERATED ALWAYS AS
                         (to_tsvector('english', description_text)) STORED
  issue_type           VARCHAR(20) DEFAULT 'task'  -- epic|story|task|bug|subtask
  status               VARCHAR(30) DEFAULT 'todo'
    -- todo|in_progress|in_review|done  (simple fixed statuses for v1)
  priority             VARCHAR(20) DEFAULT 'medium'  -- critical|high|medium|low
  reporter_id          UUID FK → users
  assignee_id          UUID FK → users
  due_date             DATE
  labels               JSONB DEFAULT '[]'        -- array of label strings
  rank                 VARCHAR(255)              -- Lexorank for drag-drop ordering
  ai_duration_estimate NUMERIC(6,2)              -- hours, from Gemini
  linked_commits_count INTEGER DEFAULT 0
  created_at           TIMESTAMPTZ DEFAULT NOW()
  updated_at           TIMESTAMPTZ DEFAULT NOW()
  deleted_at           TIMESTAMPTZ
  UNIQUE(project_id, task_key)
  discussion_thread_id UUID FK → messages

```

---

### Sprints (2 tables)

```sql
sprints
  sprint_id             UUID PK
  project_id            UUID FK → projects
  name                  VARCHAR(200) NOT NULL
  goal                  TEXT
  status                VARCHAR(20) DEFAULT 'future'  -- future|active|closed
  start_date            TIMESTAMPTZ
  end_date              TIMESTAMPTZ
  closed_at             TIMESTAMPTZ
  closed_by             UUID FK → users
  velocity_issues       INTEGER
  sequence_number       INTEGER NOT NULL
  ai_summary            JSONB
  ai_contribution_report JSONB
  summary_message_id    UUID                          -- set after channel message created
  created_at            TIMESTAMPTZ DEFAULT NOW()
  updated_at            TIMESTAMPTZ DEFAULT NOW()
  UNIQUE(project_id, sequence_number)

sprint_tasks
  id                      UUID PK
  sprint_id               UUID FK → sprints
  task_id                 UUID FK → tasks
  was_completed_in_sprint BOOLEAN
  UNIQUE(sprint_id, task_id)
```

---

### Channels & Messages (4 tables)

```sql
channels
  channel_id             UUID PK
  workspace_id           UUID FK → workspaces
  project_id             UUID FK → projects    -- NULL = workspace-level channel
  name                   VARCHAR(80)
  slug                   VARCHAR(80)
  description            TEXT
  type                   VARCHAR(20) NOT NULL   -- public|private|dm|group_dm
  is_default             BOOLEAN DEFAULT FALSE
  is_archived            BOOLEAN DEFAULT FALSE
  is_announcement_only   BOOLEAN DEFAULT FALSE
  created_by             UUID FK → users
  created_at             TIMESTAMPTZ DEFAULT NOW()
  UNIQUE(workspace_id, slug)

channel_members
  id                      UUID PK
  channel_id              UUID FK → channels
  user_id                 UUID FK → users
  joined_at               TIMESTAMPTZ DEFAULT NOW()
  UNIQUE(channel_id, user_id)

messages
  message_id       UUID PK
  channel_id       UUID FK → channels
  author_id        UUID FK → users
  is_system        BOOLEAN DEFAULT FALSE
  system_type      VARCHAR(30)
  body_text        TEXT NOT NULL DEFAULT ''
  body_blocks      JSONB
  body_tsv         TSVECTOR GENERATED ALWAYS AS (to_tsvector('english', body_text)) STORED
  thread_id        UUID FK → messages    -- parent message, NULL = top-level
  reply_count      INTEGER DEFAULT 0
  is_edited        BOOLEAN DEFAULT FALSE
  is_deleted       BOOLEAN DEFAULT FALSE
  is_pinned        BOOLEAN DEFAULT FALSE
  created_at       TIMESTAMPTZ DEFAULT NOW()
  updated_at       TIMESTAMPTZ DEFAULT NOW()

workspace_files
  file_id       UUID PK
  workspace_id  UUID FK → workspaces
  uploader_id   UUID FK → users
  filename      VARCHAR(255) NOT NULL
  storage_path  TEXT NOT NULL
  mimetype      VARCHAR(100)
  size_bytes    BIGINT
  filetype      VARCHAR(20)   -- image|pdf|code|video|audio|other
  created_at    TIMESTAMPTZ DEFAULT NOW()
```

---

### GitHub Integration (3 tables)

```sql
github_connections
  connection_id         UUID PK
  project_id            UUID FK → projects UNIQUE
  connected_by          UUID FK → users
  github_repo_full_name VARCHAR(300) NOT NULL
  github_repo_id        BIGINT
  default_branch        VARCHAR(200) DEFAULT 'main'
  github_access_token   TEXT              -- encrypted
  webhook_id            BIGINT
  webhook_secret        TEXT              -- encrypted
  created_at            TIMESTAMPTZ DEFAULT NOW()

github_commits
  id                  UUID PK
  project_id          UUID FK → projects
  task_id             UUID FK → tasks    -- NULL if no task ID in message
  commit_sha          VARCHAR(40) NOT NULL
  repo_full_name      VARCHAR(300) NOT NULL
  message             TEXT NOT NULL
  message_headline    VARCHAR(200) NOT NULL
  author_name         VARCHAR(200)
  author_github_login VARCHAR(100)
  author_user_id      UUID FK → users
  committed_at        TIMESTAMPTZ NOT NULL
  branch_name         VARCHAR(200)
  url                 TEXT
  created_at          TIMESTAMPTZ DEFAULT NOW()
  UNIQUE(repo_full_name, commit_sha)

github_ci_status
  id            UUID PK
  project_id    UUID FK → projects
  workflow_name VARCHAR(200)
  run_id        BIGINT NOT NULL
  status        VARCHAR(30) NOT NULL   -- queued|in_progress|completed
  conclusion    VARCHAR(30)            -- success|failure|cancelled|skipped
  head_branch   VARCHAR(200)
  head_sha      VARCHAR(40)
  html_url      TEXT
  triggered_at  TIMESTAMPTZ NOT NULL
  completed_at  TIMESTAMPTZ
  created_at    TIMESTAMPTZ DEFAULT NOW()


```

---

### Notifications (1 table)

```sql
notifications
  notification_id UUID PK
  recipient_id    UUID FK → users
  actor_id        UUID FK → users
  type            VARCHAR(50) NOT NULL
    -- task_assigned|task_mentioned|task_commented
    -- sprint_closed|sprint_started
    -- channel_mentioned|dm_received
    -- ci_failed|commit_linked
  entity_type     VARCHAR(30) NOT NULL   -- task|sprint|message|project
  entity_id       UUID NOT NULL
  title           VARCHAR(255)
  body            TEXT
  is_read         BOOLEAN DEFAULT FALSE
  read_at         TIMESTAMPTZ
  created_at      TIMESTAMPTZ DEFAULT NOW()
```

---

### Audit (1 table)

```sql
audit_logs
  log_id       UUID PK
  actor_id     UUID FK → users
  action       VARCHAR(100) NOT NULL
  entity_type  VARCHAR(30)
  entity_id    UUID
  old_values   JSONB
  new_values   JSONB
  created_at   TIMESTAMPTZ DEFAULT NOW()
```

---

## Final Table Count: 18 Tables

| Group | Tables |
|---|---|
| Auth | users, refresh_tokens |
| Workspace | workspaces, workspace_members |
| Project | projects, project_members |
| Tasks | tasks |
| Sprints | sprints, sprint_tasks |
| Messaging | channels, channel_members, messages, workspace_files |
| GitHub | github_connections, github_commits, github_ci_status |
| Notifications | notifications |
| Audit | audit_logs |

---

## Essential Indexes (run as one migration)

```sql
-- Search
CREATE INDEX idx_tasks_title_tsv ON tasks USING GIN(to_tsvector('english', title));
CREATE INDEX idx_tasks_description_tsv ON tasks USING GIN(description_tsv);
CREATE INDEX idx_messages_tsv ON messages USING GIN(body_tsv);

-- Board loading
CREATE INDEX idx_tasks_project_status ON tasks(project_id, status) WHERE deleted_at IS NULL;
CREATE INDEX idx_tasks_sprint ON tasks(sprint_id) WHERE sprint_id IS NOT NULL;

-- Message loading
CREATE INDEX idx_messages_channel_created ON messages(channel_id, created_at DESC) WHERE is_deleted = FALSE;
CREATE INDEX idx_messages_thread ON messages(thread_id) WHERE thread_id IS NOT NULL;

-- Notifications
CREATE INDEX idx_notifications_recipient ON notifications(recipient_id, is_read, created_at DESC);

-- Membership checks (hit on every authenticated request)
CREATE INDEX idx_workspace_members_user ON workspace_members(user_id, workspace_id);
CREATE INDEX idx_project_members_user ON project_members(user_id, project_id);
CREATE INDEX idx_channel_members_user ON channel_members(user_id, channel_id);
```

---

That's it. 18 tables, 6 roles, these indexes. Everything in the PDF beyond this is real-world enterprise complexity — irrelevant for your submission, your demo, and your viva. Build this cleanly and you're done.