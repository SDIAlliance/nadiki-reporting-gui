#!/bin/bash

# Stress test script for Ollama
# Runs 100 iterations with 3 parallel requests each (300 total requests)

TOTAL_ITERATIONS=100
PARALLEL_REQUESTS=3

# Array of topics to vary the prompts
topics=(
  "climate change adaptation"
  "artificial intelligence ethics"
  "renewable energy systems"
  "urban sustainability"
  "biotechnology innovations"
  "quantum computing applications"
  "ocean conservation strategies"
  "sustainable agriculture"
  "space exploration technologies"
  "cybersecurity frameworks"
)

# Array of fields to vary
fields=(
  "Environmental Science"
  "Computer Science"
  "Engineering"
  "Public Health"
  "Data Science"
  "Economics"
  "Physics"
  "Biology"
  "Chemistry"
  "Social Science"
)

# Function to make a single request
make_request() {
  local iteration=$1
  local request_num=$2
  local topic=${topics[$((iteration % ${#topics[@]}))]}
  local field=${fields[$((request_num % ${#fields[@]}))]}

  curl -s http://localhost:11434/api/generate -d @- << EOF > /dev/null
{
  "model": "gemma3",
  "prompt": "Develop a research proposal for investigating ${topic} in the field of ${field}. Request #${iteration}-${request_num}.\n\nInclude: 1) Abstract 2) Research Questions 3) Methodology 4) Expected Results.\n\nMake this approximately 500 words covering key aspects of the research design.",
  "stream": false
}
EOF
  echo "Completed request ${iteration}-${request_num}"
}

echo "Starting Ollama stress test: ${TOTAL_ITERATIONS} iterations × ${PARALLEL_REQUESTS} parallel requests = $((TOTAL_ITERATIONS * PARALLEL_REQUESTS)) total requests"
echo "Started at: $(date)"
start_time=$(date +%s)

for i in $(seq 1 $TOTAL_ITERATIONS); do
  echo "--- Iteration $i/$TOTAL_ITERATIONS ---"

  # Launch parallel requests
  for j in $(seq 1 $PARALLEL_REQUESTS); do
    make_request $i $j &
  done

  # Wait for all parallel requests to complete
  wait

  echo "Iteration $i complete"
done

end_time=$(date +%s)
duration=$((end_time - start_time))

echo ""
echo "===== Stress Test Complete ====="
echo "Total requests: $((TOTAL_ITERATIONS * PARALLEL_REQUESTS))"
echo "Duration: ${duration} seconds"
echo "Average time per iteration: $((duration / TOTAL_ITERATIONS)) seconds"
echo "Finished at: $(date)"
