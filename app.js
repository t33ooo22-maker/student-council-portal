import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";

import {
  getAuth,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

import {
  getFirestore,
  collection,
  doc,
  getDoc,
  addDoc,
  deleteDoc,
  updateDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

// ใช้ค่าจาก Firebase Console > Project settings > Your apps
const firebaseConfig = {
  apiKey: "AIzaSyDkhXbRmTjtLSd5A_Z1E7b92ML19SfQOGk",
  authDomain: "student-council-portal-b3a53.firebaseapp.com",
  projectId: "student-council-portal-b3a53",
  storageBucket: "student-council-portal-b3a53.firebasestorage.app",
  messagingSenderId: "215972325644",
  appId: "1:215972325644:web:2806ddd973d459c8fa8129"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const $ = (selector) => document.querySelector(selector);

let currentUser = null;
let currentRole = null;
let unsubscribeActivities = null;

const loginDialog = $("#loginDialog");
const activityDialog = $("#activityDialog");
const loginForm = $("#loginForm");
const activityForm = $("#activityForm");
const activityList = $("#activityList");

function showMessage(selector, message) {
  const element = $(selector);
  if (element) element.textContent = message;
}

function notify(message) {
  const toast = $("#toast");
  if (toast) {
    toast.textContent = message;
    toast.hidden = false;
  } else {
    alert(message);
  }
}

function makeButton(text, className, action) {
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = text;
  button.className = className;
  button.addEventListener("click", action);
  return button;
}

function addText(parent, tag, text, className = "") {
  const element = document.createElement(tag);
  element.textContent = text || "";
  if (className) element.className = className;
  parent.appendChild(element);
  return element;
}

function setupAccountControls() {
  let accountArea = $("#accountArea");

  if (!accountArea) {
    accountArea = document.createElement("div");
    accountArea.id = "accountArea";
    accountArea.style.cssText =
      "display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin:12px 0";

    const header = document.querySelector("header");
    (header || document.body).appendChild(accountArea);
  }

  accountArea.replaceChildren();

  if (!currentUser) {
    accountArea.appendChild(
      makeButton("เข้าสู่ระบบ", "btn btn-primary", () => {
        if (loginDialog?.showModal) loginDialog.showModal();
        else notify("กรุณาเปิดหน้าต่างเข้าสู่ระบบ");
      })
    );
    return;
  }

  addText(
    accountArea,
    "span",
    `${currentUser.email || ""} · ${
      currentRole === "president" ? "ประธาน" : "กรรมการ"
    }`
  );

  accountArea.appendChild(
    makeButton("ออกจากระบบ", "btn btn-secondary", async () => {
      await signOut(auth);
    })
  );
}

function setupAssignmentField() {
  const description = $("#activityDescription");
  if (!description || $("#assignedTo")) return;

  const label = document.createElement("label");
  label.htmlFor = "assignedTo";
  label.textContent = "UID ของกรรมการที่รับผิดชอบ";
  label.style.display = "block";

  const input = document.createElement("input");
  input.id = "assignedTo";
  input.type = "text";
  input.placeholder = "วาง UID ของกรรมการ";
  input.autocomplete = "off";
  input.style.cssText = "width:100%;box-sizing:border-box";

  const help = document.createElement("small");
  help.textContent =
    "ดู UID ได้จาก Firebase Authentication > Users หากยังไม่มอบหมาย ให้เว้นว่าง";

  description.insertAdjacentElement("afterend", help);
  help.insertAdjacentElement("afterend", input);
  input.insertAdjacentElement("beforebegin", label);
}

function renderActivities(items) {
  if (!activityList) return;

  activityList.replaceChildren();

  if (!items.length) {
    addText(activityList, "p", "ยังไม่มีงานในระบบ");
  }

  for (const item of items) {
    const card = document.createElement("article");
    card.className = "activity-card";
    card.style.cssText =
      "padding:16px;margin:12px 0;border:1px solid #d8e8c8;border-radius:14px;background:#fffef5";

    addText(card, "h3", item.title || "ไม่มีชื่อกิจกรรม");
    addText(card, "p", `วันที่: ${item.date || "-"}`);
    addText(card, "p", `สถานะ: ${item.status || "กำลังดำเนินการ"}`);
    addText(card, "p", item.description || "ไม่มีรายละเอียด");
    addText(
      card,
      "p",
      `รายงานกรรมการ: ${item.report || "ยังไม่ได้ส่งรายงาน"}`
    );

    if (currentRole === "president") {
      addText(card, "p", `UID ผู้รับผิดชอบ: ${item.assignedTo || "ยังไม่มอบหมาย"}`);

      card.appendChild(
        makeButton("ลบงาน", "btn btn-secondary", async () => {
          if (!confirm("ต้องการลบงานนี้ใช่หรือไม่?")) return;
          try {
            await deleteDoc(doc(db, "activities", item.id));
            notify("ลบงานแล้ว");
          } catch (error) {
            console.error(error);
            notify("ลบไม่สำเร็จ กรุณาตรวจสอบ Rules");
          }
        })
      );
    }

    if (currentRole === "committee" && item.assignedTo === currentUser.uid) {
      const statusLabel = addText(card, "label", "อัปเดตสถานะ");
      const status = document.createElement("select");

      for (const value of ["กำลังดำเนินการ", "เสร็จสิ้น"]) {
        const option = document.createElement("option");
        option.value = value;
        option.textContent = value;
        status.appendChild(option);
      }

      status.value = item.status || "กำลังดำเนินการ";
      statusLabel.appendChild(status);

      const reportLabel = addText(card, "label", "รายงานผลการทำงาน");
      reportLabel.style.display = "block";

      const report = document.createElement("textarea");
      report.maxLength = 1000;
      report.rows = 3;
      report.value = item.report || "";
      report.placeholder = "พิมพ์ผลการทำงานไม่เกิน 1,000 ตัวอักษร";
      report.style.cssText = "display:block;width:100%;box-sizing:border-box";
      reportLabel.appendChild(report);

      card.appendChild(
        makeButton("บันทึกสถานะและรายงาน", "btn btn-primary", async () => {
          try {
            await updateDoc(doc(db, "activities", item.id), {
              status: status.value,
              report: report.value.trim(),
              reportUpdatedAt: serverTimestamp()
            });
            notify("บันทึกรายงานแล้ว");
          } catch (error) {
            console.error(error);
            notify("บันทึกไม่สำเร็จ กรุณาตรวจสอบ Rules");
          }
        })
      );
    }

    activityList.appendChild(card);
  }

  const total = $("#activityCount");
  const done = $("#doneCount");
  const pending = $("#pendingCount");

  if (total) total.textContent = String(items.length);
  if (done) {
    done.textContent = String(
      items.filter((item) => item.status === "เสร็จสิ้น").length
    );
  }
  if (pending) {
    pending.textContent = String(
      items.filter((item) => item.status !== "เสร็จสิ้น").length
    );
  }
}

function listenActivities() {
  if (unsubscribeActivities) {
    unsubscribeActivities();
    unsubscribeActivities = null;
  }

  if (!currentUser || !currentRole) return;

  const activities = collection(db, "activities");

  // กรรมการต้องค้นหาด้วย UID ของตัวเองให้ตรงกับ Firestore Rules
  const activitiesQuery =
    currentRole === "committee"
      ? query(activities, where("assignedTo", "==", currentUser.uid))
      : query(activities, orderBy("createdAt", "desc"));

  unsubscribeActivities = onSnapshot(
    activitiesQuery,
    (snapshot) => {
      const items = snapshot.docs.map((item) => ({
        id: item.id,
        ...item.data()
      }));
      renderActivities(items);
    },
    (error) => {
      console.error(error);
      notify("โหลดงานไม่ได้ กรุณาตรวจสอบการเข้าสู่ระบบและ Firestore Rules");
    }
  );
}

loginForm?.addEventListener("submit", async (event) => {
  event.preventDefault();

  const email = $("#email")?.value.trim();
  const password = $("#password")?.value;

  if (!email || !password) {
    showMessage("#loginMessage", "กรุณากรอกอีเมลและรหัสผ่าน");
    return;
  }

  try {
    await signInWithEmailAndPassword(auth, email, password);
    showMessage("#loginMessage", "");

    if (loginDialog?.open) loginDialog.close();
    loginForm.reset();
  } catch (error) {
    console.error(error);
    showMessage("#loginMessage", "เข้าสู่ระบบไม่สำเร็จ ตรวจสอบอีเมลและรหัสผ่าน");
  }
});

activityForm?.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!currentUser || currentRole !== "president") {
    notify("เฉพาะประธานเท่านั้นที่เพิ่มงานได้");
    return;
  }

  const title = $("#activityTitle")?.value.trim();
  const date = $("#activityDate")?.value;
  const status = $("#activityStatus")?.value || "กำลังดำเนินการ";
  const description = $("#activityDescription")?.value.trim() || "";
  const assignedTo = $("#assignedTo")?.value.trim() || "";

  if (!title || title.length > 100) {
    showMessage("#activityMessage", "กรุณากรอกชื่องานไม่เกิน 100 ตัวอักษร");
    return;
  }

  if (!["กำลังดำเนินการ", "เสร็จสิ้น"].includes(status)) {
    showMessage("#activityMessage", "กรุณาเลือกสถานะที่ถูกต้อง");
    return;
  }

  try {
    await addDoc(collection(db, "activities"), {
      title,
      date: date || "",
      status,
      description,
      assignedTo,
      report: "",
      createdBy: currentUser.uid,
      createdAt: serverTimestamp()
    });

    activityForm.reset();
    showMessage("#activityMessage", "");
    if (activityDialog?.open) activityDialog.close();
    notify("บันทึกงานเรียบร้อยแล้ว");
  } catch (error) {
    console.error(error);
    showMessage("#activityMessage", "บันทึกไม่ได้ กรุณาตรวจสอบ Firestore Rules");
  }
});

$("#loginOpen")?.addEventListener("click", () => {
  if (loginDialog?.showModal) loginDialog.showModal();
});

$("#addActivityOpen")?.addEventListener("click", () => {
  if (currentRole !== "president") {
    notify("เฉพาะประธานเท่านั้นที่เพิ่มงานได้");
    return;
  }
  if (activityDialog?.showModal) activityDialog.showModal();
});

onAuthStateChanged(auth, async (user) => {
  currentUser = user;
  currentRole = null;

  if (unsubscribeActivities) {
    unsubscribeActivities();
    unsubscribeActivities = null;
  }

  if (!user) {
    setupAccountControls();
    renderActivities([]);
    return;
function notify(message) {
  const toast = document.querySelector("#toast");

  if (!toast) {
    alert(message);
    return;
  }

  toast.textContent = message;
  toast.hidden = false;
  toast.classList.add("show");

  clearTimeout(window.toastTimer);
  window.toastTimer = setTimeout(() => {
    toast.classList.remove("show");
  }, 4000);
}
