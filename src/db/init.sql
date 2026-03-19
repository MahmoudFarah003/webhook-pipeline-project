CREATE TABLE pipelines (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  action_type TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE subscribers (
  id SERIAL PRIMARY KEY,
  pipeline_id INTEGER REFERENCES pipelines(id),
  url TEXT NOT NULL
);

CREATE TABLE jobs (
  id SERIAL PRIMARY KEY,
  pipeline_id INTEGER REFERENCES pipelines(id),
  payload JSONB,
  status TEXT DEFAULT 'pending',
  result JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  processed_at TIMESTAMP
);

CREATE TABLE delivery_attempts (
  id SERIAL PRIMARY KEY,
  job_id INTEGER REFERENCES jobs(id),
  subscriber_id INTEGER REFERENCES subscribers(id),
  attempt_number INTEGER,
  status TEXT,
  response_code INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);