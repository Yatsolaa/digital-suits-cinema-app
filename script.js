const sessionTimes = ["10:00 AM", "12:00 PM", "2:00 PM", "4:00 PM", "6:00 PM", "8:00 PM"];
const seatsPerSession = 25;
const seatContainer = document.getElementById("seat-container");
const sessionsContainer = document.getElementById("sessions");
const dateSelector = document.getElementById("date");

let selectedSeats = [];
let currentSessionKey = null;

const formatDateForDisplay = (isoDate) => {
  const [yyyy, mm, dd] = isoDate.split("-");
  return `${dd}-${mm}-${yyyy}`;
};

const getToday = () => new Date().toISOString().split("T")[0];
const getBookingData = () => JSON.parse(localStorage.getItem("bookingData") || "{}");
const saveBookingData = (data) => localStorage.setItem("bookingData", JSON.stringify(data));

const populateDateOptions = () => {
  const today = new Date();
  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    const formatted = date.toISOString().split("T")[0];

    const option = document.createElement("option");
    option.value = formatted;
    option.textContent = formatDateForDisplay(formatted);
    dateSelector.appendChild(option);
  }
};

const renderSessions = () => {
  sessionsContainer.innerHTML = "";
  sessionTimes.forEach((time, index) => {
    const sessionEl = document.createElement("div");
    sessionEl.className = "session";
    sessionEl.textContent = time;
    sessionEl.dataset.index = index;
    sessionEl.onclick = () => selectSession(index);
    sessionsContainer.appendChild(sessionEl);
  });
};

const selectSession = (index) => {
  document.querySelectorAll(".session").forEach(el => el.classList.remove("active"));
  document.querySelectorAll(".session")[index].classList.add("active");
  renderSeats(dateSelector.value, index);
};

const renderSeats = (date, sessionIndex) => {
  seatContainer.innerHTML = "";
  const grid = document.createElement("div");
  grid.className = "seat-grid";

  const sessionKey = `${date}_${sessionIndex}`;
  const bookedSeats = getBookingData()[sessionKey] || [];

  selectedSeats = [];
  currentSessionKey = sessionKey;

  for (let i = 1; i <= seatsPerSession; i++) {
    const seat = document.createElement("div");
    seat.className = "seat";
    seat.textContent = i;

    if (bookedSeats.includes(i)) {
      seat.classList.add("booked");
    } else {
      seat.addEventListener("click", () => toggleSeatSelection(seat, i));
    }
    grid.appendChild(seat);
  }

  seatContainer.appendChild(grid);

  const confirmBtn = document.createElement("button");
  confirmBtn.textContent = "Confirm Selection";
  confirmBtn.onclick = confirmBooking;
  seatContainer.appendChild(confirmBtn);

  const summary = document.createElement("div");
  summary.id = "booking-summary";
  summary.style.marginTop = "20px";
  seatContainer.appendChild(summary);
};

const toggleSeatSelection = (seatEl, seatNumber) => {
  const isSelected = seatEl.classList.toggle("selected");
  if (isSelected) {
    selectedSeats.push(seatNumber);
  } else {
    selectedSeats = selectedSeats.filter(num => num !== seatNumber);
  }
  updateSummary();
};

const confirmBooking = () => {
  if (!currentSessionKey) return;

  const bookingData = getBookingData();
  const currentBooked = bookingData[currentSessionKey] || [];

  selectedSeats.forEach(seat => {
    if (!currentBooked.includes(seat)) currentBooked.push(seat);
  });

  bookingData[currentSessionKey] = currentBooked;
  saveBookingData(bookingData);

  showPopup();
  renderSeats(...currentSessionKey.split("_"));
};

const updateSummary = () => {
  const summary = document.getElementById("booking-summary");
  if (summary) {
    summary.textContent = selectedSeats.length
      ? `Selected seats: ${selectedSeats.sort((a, b) => a - b).join(", ")}`
      : "No seats selected.";
  }
};

const showPopup = () => {
  const [isoDate, sessionIndex] = currentSessionKey.split("_");
  const time = sessionTimes[parseInt(sessionIndex)];
  const displayDate = formatDateForDisplay(isoDate);
  const seats = selectedSeats.sort((a, b) => a - b).join(", ");

  const popup = document.createElement("div");
  Object.assign(popup.style, {
    position: "fixed",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    background: "#ffffff",
    border: "1px solid #ccc",
    padding: "30px",
    boxShadow: "0 8px 20px rgba(0, 0, 0, 0.3)",
    zIndex: "1000",
    borderRadius: "12px",
    textAlign: "center",
    minWidth: "300px",
  });

  popup.innerHTML = `
    <h2>🎟️ Booking Confirmed!</h2>
    <p>Date: <strong>${displayDate}</strong><br>Time: <strong>${time}</strong><br>Seats: <strong>${seats}</strong></p>
  `;

  const downloadBtn = document.createElement("button");
  downloadBtn.textContent = "Download Ticket (PDF)";
  downloadBtn.style.margin = "10px";
  downloadBtn.onclick = () => {
    import("https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js").then(() => {
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF();
      doc.setFontSize(16);
      doc.text("Cinema Ticket", 20, 20);
      doc.setFontSize(12);
      doc.text(`Date: ${displayDate}`, 20, 40);
      doc.text(`Time: ${time}`, 20, 50);
      doc.text(`Seats: ${seats}`, 20, 60);
      doc.save(`ticket_${displayDate.replace(/-/g, "")}_${time.replace(/:/g, "-")}.pdf`);
    });
  };
  popup.appendChild(downloadBtn);

  const closeBtn = document.createElement("button");
  closeBtn.textContent = "Close";
  closeBtn.style.margin = "10px";
  closeBtn.onclick = () => document.body.removeChild(popup);
  popup.appendChild(closeBtn);

  document.body.appendChild(popup);
};

// Reset UI when date changes
dateSelector.addEventListener("change", () => {
  document.querySelectorAll(".session").forEach(el => el.classList.remove("active"));
  seatContainer.innerHTML = "";
  selectedSeats = [];
  currentSessionKey = null;
});

// Initialization
populateDateOptions();
renderSessions();
