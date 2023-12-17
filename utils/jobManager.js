const jobs = {}

export const setJob = (name, newJob) => {
  jobs[name] = newJob
}

export const getJob = (name) => jobs[name]

export const cancelJob = (name) => {
  if (jobs[name]) {
    jobs[name].cancel()
    delete jobs[name]
  }
}

// // 在 scheduler.js 設置 job
// import { setJob } from './jobManager';
// // ...其他代碼...

// // 創建並設置新 job
// const jobName = 'updateBookingDate';
// const updateBookingDateJob = schedule.scheduleJob(rule, async () => {
//   // ...job 的邏輯...
// });
// setJob(jobName, updateBookingDateJob);

// // 在另一個文件中取消 job
// import { cancelJob } from './jobManager';

// // 取消特定的 job
// cancelJob('updateBookingDate');
