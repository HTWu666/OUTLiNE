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

// // 在設置 job 的控制器中
// const jobManager = require('./jobManager')
// jobManager.setJob(
//   schedule.scheduleJob(rule, () => {
//     console.log('hihi!!')
//   })
// )

// // 在需要修改 job 的控制器中
// const jobManager = require('./jobManager')
// const currentJob = jobManager.getJob()
// if (currentJob) {
//   jobManager.cancelJob()
//   // 重新安排或修改 job
// }
