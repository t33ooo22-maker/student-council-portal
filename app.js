// เว็บไซต์ตัวอย่าง Student Council — ทำงานได้โดยไม่ต้องตั้งค่า Firebase สำหรับการดูหน้าเว็บ
// กรอกค่าจาก Firebase Console ใน firebase-config.js เมื่อพร้อมเชื่อมฐานข้อมูลจริง
const sampleActivities = [
  { id: "sample-1", title: "กิจกรรมจิตอาสาพัฒนาโรงเรียน", date: "2026-10-22", status: "กำลังดำเนินการ", description: "ร่วมกันดูแลพื้นที่ส่วนกลางและสร้างสภาพแวดล้อมที่น่าอยู่", icon: "♧" },
  { id: "sample-2", title: "ประชุมสภานักเรียนประจำเดือน", date: "2026-10-08", status: "เสร็จสิ้น", description: "สรุปผลการดำเนินงานและวางแผนกิจกรรมของเดือนถัดไป", icon: "✦" },
  { id: "sample-3", title: "โครงการโรงเรียนสะอาด", date: "2026-10-03", status: "เสร็จสิ้น", description: "ส่งเสริมการคัดแยกขยะและการรักษาความสะอาดในโรงเรียน", icon: "♻" }
];
const $ = (selector) => document.querySelector(selector);
const activityList = $("#activityList");
const loginDialog = $("#loginDialog");
const activityDialog = $("#activityDialog");
let activities = [...sampleActivities];

function showToast(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.add("show");
  window.setTimeout(() => toast.classList.remove("show"), 2800);
}
function formatDate(value) {
  if (!value) return "ไม่ระบุวันที่";
  const d = new Date(`${value}T00:00:00`);
  return new Intl.DateTimeFormat("th-TH", { day: "numeric", month: "short", year: "numeric" }).format(d);
}
function renderActivities() {
  activityList.innerHTML = "";
  activities.forEach((item) => {
    const card = document.createElement("article");
    card.className = "activity-card";
    const banner = document.createElement("div");
    banner.className = "activity-banner";
    const art = document.createElement("span");
    art.className = "activity-art";
    art.textContent = item.icon || "✦";
    const status = document.createElement("span");
    status.className = "status-pill";
    status.textContent = item.status;
    banner.append(art, status);
    const body = document.createElement("div");
    body.className = "activity-body";
    const date = document.createElement("div");
    date.className = "activity-date";
    date.textContent = formatDate(item.date);
    const title = document.createElement("h3");
    title.textContent = item.title;
    const description = document.createElement("p");
    description.textContent = item.description || "ไม่มีรายละเอียดเพิ่มเติม";
    const foot = document.createElement("div");
    foot.className = "activity-foot";
    const left = document.createElement("span");
    left.textContent = "สภานักเรียน";
    const right = document.createElement("b");
    right.textContent = item.status === "เสร็จสิ้น" ? "✓ เสร็จสิ้น" : "◷ กำลังทำ";
    foot.append(left, right);
    body.append(date, title, description, foot);
    card.append(banner, body);
    activityList.append(card);
  });
  $("#activityCount").textContent = String(activities.length).padStart(2, "0");
  $("#doneCount").textContent = String(activities.filter(x => x.status === "เสร็จสิ้น").length).padStart(2, "0");
  $("#pendingCount").textContent = String(activities.filter(x => x.status !== "เสร็จสิ้น").length).padStart(2, "0");
}
$("#loginOpen").addEventListener("click", () => loginDialog.showModal());
$("#addActivityOpen").addEventListener("click", () => activityDialog.showModal());
$("#loginForm").addEventListener("submit", (event) => {
  event.preventDefault();
  $("#loginMessage").textContent = "หน้านี้เป็นส่วนติดต่อผู้ใช้ตัวอย่าง ยังไม่ได้เชื่อม Firebase Authentication จึงยังไม่ตรวจสอบบัญชีจริง";
  showToast("ต้องตั้งค่า Firebase Authentication ก่อนเข้าสู่ระบบจริง");
});
$("#activityForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const title = $("#activityTitle").value.trim();
  if (!title) return;
  activities.unshift({
    id: `local-${Date.now()}`,
    title,
    date: $("#activityDate").value,
    status: $("#activityStatus").value,
    description: $("#activityDescription").value.trim(),
    icon: "✦"
  });
  renderActivities();
  activityDialog.close();
  event.target.reset();
  showToast("เพิ่มกิจกรรมในหน้าตัวอย่างแล้ว — ยังไม่ได้บันทึกขึ้นฐานข้อมูลออนไลน์");
});
renderActivities();
