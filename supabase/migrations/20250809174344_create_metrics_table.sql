-- Create metrics table
CREATE TABLE IF NOT EXISTS metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  metric_name TEXT NOT NULL UNIQUE,
  unit TEXT NOT NULL CHECK (unit IN (
    'W', 'kW', 'MW', 'Wh', 'kWh', 'MWh', 
    'W/s', 'kW/s', 'A', 'V', 'Hz', 
    'C', 'F', '%', 'ratio', 'count'
  )),
  entity TEXT NOT NULL CHECK (entity IN ('Facility', 'Server', 'Rack')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on metric_name for faster lookups
CREATE INDEX idx_metrics_metric_name ON metrics(metric_name);

-- Create index on entity for filtering
CREATE INDEX idx_metrics_entity ON metrics(entity);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_metrics_updated_at
  BEFORE UPDATE ON metrics
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();