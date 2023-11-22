let job = null

export const setJob = (newJob) => {
  job = newJob
}

export const getJob = () => job

export const cancelJob = () => {
  if (job) {
    job.cancel()
    job = null
  }
}
