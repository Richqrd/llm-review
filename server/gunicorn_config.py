import multiprocessing
import os

# Basic server settings
bind = '0.0.0.0:8080'  # The address to bind to (default is 127.0.0.1:8000)
workers = int(os.environ.get("CPUS", multiprocessing.cpu_count() * 2 + 1)) # Number of worker processes
timeout = int(os.environ.get("WORKER_TIMEOUT", 60*3)) # Worker timeout

# Worker settings
# threads = 2  # Number of threads per worker
# timeout = 30  # Timeout for each worker process

# Logging settings
accesslog = '-'  # Log access information to stdout (use a file path for logging to a file)
errorlog = '-'  # Log error information to stdout (use a file path for logging to a file)
loglevel = 'info'  # Logging level (debug, info, warning, error, critical)
