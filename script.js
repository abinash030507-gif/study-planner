const form = document.getElementById("task-form");
const titleInput = document.getElementById("title");
const subjectInput = document.getElementById("subject");
const dueDateInput = document.getElementById("dueDate");
const hoursInput = document.getElementById("hours");
const priorityInput = document.getElementById("priority");

const filterSelect = document.getElementById("filter");
const tableBody = document.getElementById("task-table-body");
const suggestedTaskBox = document.getElementById("suggested-task");

const STORAGE_KEY = "smart-study-planner-tasks";

let tasks = [];

// Load tasks from localStorage on startup
function loadTasks() {
    const raw = localStorage.getItem(STORAGE_KEY);
    tasks = raw ? JSON.parse(raw) : [];
}

// Save tasks to localStorage
function saveTasks() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

// Add a new task object
function addTask(task) {
    tasks.push(task);
    saveTasks();
    render();
}

// Delete task by id
function deleteTask(id) {
    tasks = tasks.filter((t) => t.id !== id);
    saveTasks();
    render();
}

// Toggle done state
function toggleDone(id) {
    const task = tasks.find((t) => t.id === id);
    if (task) {
        task.done = !task.done;
        saveTasks();
        render();
    }
}

// Sort tasks by due date, then priority
function sortedTasks() {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return [...tasks].sort((a, b) => {
        const dateA = new Date(a.dueDate);
        const dateB = new Date(b.dueDate);
        if (dateA.getTime() !== dateB.getTime()) {
            return dateA - dateB;
        }
        return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
}

// Filter tasks by selected filter
function filteredTasks() {
    const all = sortedTasks();
    const filter = filterSelect.value;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (filter === "all") return all;

    if (filter === "today") {
        return all.filter((t) => {
            const d = new Date(t.dueDate);
            d.setHours(0, 0, 0, 0);
            return d.getTime() === today.getTime();
        });
    }

    if (filter === "week") {
        const weekFromNow = new Date(today);
        weekFromNow.setDate(today.getDate() + 7);
        return all.filter((t) => {
            const d = new Date(t.dueDate);
            d.setHours(0, 0, 0, 0);
            return d >= today && d <= weekFromNow;
        });
    }

    if (filter === "overdue") {
        return all.filter((t) => {
            const d = new Date(t.dueDate);
            d.setHours(0, 0, 0, 0);
            return d < today && !t.done;
        });
    }

    return all;
}

// Render table rows and suggestion
function render() {
    renderTable();
    renderSuggestion();
}

// Render tasks into table
function renderTable() {
    tableBody.innerHTML = "";

    const list = filteredTasks();

    if (list.length === 0) {
        const row = document.createElement("tr");
        const cell = document.createElement("td");
        cell.colSpan = 7;
        cell.textContent = "No tasks to show.";
        row.appendChild(cell);
        tableBody.appendChild(row);
        return;
    }

    list.forEach((task) => {
        const row = document.createElement("tr");

        const doneCell = document.createElement("td");
        const doneCheckbox = document.createElement("input");
        doneCheckbox.type = "checkbox";
        doneCheckbox.checked = task.done;
        doneCheckbox.addEventListener("change", () => toggleDone(task.id));
        doneCell.appendChild(doneCheckbox);

        const titleCell = document.createElement("td");
        titleCell.textContent = task.title;
        if (task.done) titleCell.classList.add("task-done");

        const subjectCell = document.createElement("td");
        subjectCell.textContent = task.subject;
        if (task.done) subjectCell.classList.add("task-done");

        const dueCell = document.createElement("td");
        dueCell.textContent = task.dueDate;

        const hoursCell = document.createElement("td");
        hoursCell.textContent = task.hours;

        const priorityCell = document.createElement("td");
        const badge = document.createElement("span");
        if (task.priority === "high") badge.className = "priority-high";
        else if (task.priority === "medium") badge.className = "priority-medium";
        else badge.className = "priority-low";
        badge.textContent = task.priority.charAt(0).toUpperCase() + task.priority.slice(1);
        priorityCell.appendChild(badge);

        const actionsCell = document.createElement("td");
        const deleteBtn = document.createElement("button");
        deleteBtn.textContent = "✕";
        deleteBtn.className = "btn-icon delete";
        deleteBtn.addEventListener("click", () => deleteTask(task.id));
        actionsCell.appendChild(deleteBtn);

        row.appendChild(doneCell);
        row.appendChild(titleCell);
        row.appendChild(subjectCell);
        row.appendChild(dueCell);
        row.appendChild(hoursCell);
        row.appendChild(priorityCell);
        row.appendChild(actionsCell);

        tableBody.appendChild(row);
    });
}

// Show suggested task
function renderSuggestion() {
    const available = sortedTasks().filter((t) => !t.done);
    if (available.length === 0) {
        suggestedTaskBox.innerHTML = "<p>No pending tasks. You're all caught up!</p>";
        return;
    }

    const top = available[0];
    const due = new Date(top.dueDate).toLocaleDateString();

    suggestedTaskBox.innerHTML = `
    <p><strong>${top.title}</strong> (${top.subject})</p>
    <p>Due on <strong>${due}</strong> – priority <strong>${top.priority}</strong>, about ${top.hours} hour(s).</p>
  `;
}

// Handle form submit
form.addEventListener("submit", (e) => {
    e.preventDefault();

    const title = titleInput.value.trim();
    const subject = subjectInput.value.trim();
    const dueDate = dueDateInput.value;
    const hours = parseFloat(hoursInput.value);
    const priority = priorityInput.value;

    if (!title || !subject || !dueDate || !hours) {
        alert("Please fill in all fields.");
        return;
    }

    const newTask = {
        id: Date.now().toString(),
        title,
        subject,
        dueDate,
        hours,
        priority,
        done: false,
    };

    addTask(newTask);

    form.reset();
    priorityInput.value = "medium";
});

// Handle filter change
filterSelect.addEventListener("change", render);

// Initialize
loadTasks();
render();
