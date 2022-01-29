export function toggleFilter(index, id) {
    document.getElementById(id).classList.toggle("filter--show");
    // document.getElementById("arrow").classList.toggle("arrow__icon--rotate");
    document.getElementsByClassName("arrow__icon")[index].classList.toggle("arrow__icon--rotate");
}

export function resetFilter(index) {
  document.getElementsByClassName("arrow__icon")[index].classList.remove("arrow__icon--rotate");
}

// export function showModal(id) {
//     document.getElementById(id).style.display = "flex";
// }

// export function closeModal(id) {
//     document.getElementById(id).style.display = "none";
// }

export function toggleTooltip(inputID, tooltipTextID) {
    document.getElementById(inputID).addEventListener("focus", () => {
      document.getElementById(tooltipTextID).style.opacity = 1;
    });

    document.getElementById(inputID).addEventListener("blur", () => {
      document.getElementById(tooltipTextID).style.opacity = 0;
    });
}

// var tooltipTimeout;

// export function resetTooltip() {
//   clearTimeout(tooltipTimeout);
// }

export function triggerTooltip(tooltipTextID) {
  let tooltip = document.getElementById(tooltipTextID);
  tooltip.style.opacity = 1;

  setTimeout(() => {
    if (tooltip) tooltip.style.opacity = 0;
  }, 2000);
}

// export function retainTooltip(tooltipTextID) {
//   document.getElementById(tooltipTextID).style.opacity = 1;
// }

// export function releaseTooltip(tooltipTextID) {
//   setTimeout(() => {
//     document.getElementById(tooltipTextID).style.opacity = 0;
//   }, 2000);
// }

export function toggleFieldError(element, error) {
  if (error) {
    element.classList.add("field--error");
    element.classList.remove("field--sucess");
  } else {
    element.classList.remove("field--error");
    element.classList.add("field--success");
  }
}

export function toggleSearch(event) {
  if(event.target.id === "searchIcon" || event.target.id === "searchInput") {
      document.getElementById("searchInput").style.width = "120px";
  } else {
      document.getElementById("searchInput").style.width = "0";
  }
}

const months = ["Jan", "Feb", "Mar","Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function formatDate(date) {
  return date.getUTCFullYear() + " " + months[date.getMonth()] + " " + date.getUTCDate() + ", " + date.getUTCHours() + ":" + ((date.getMinutes() < 10 ? "0" : "") + date.getMinutes()) + " " + (date.getUTCHours() >= 12 ? "PM" : "AM")
}

