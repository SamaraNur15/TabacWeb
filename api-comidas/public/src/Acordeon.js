const items = document.querySelectorAll(".faq-item");

items.forEach((item) => {
item.addEventListener("toggle", () => {
    if (item.open) {
    items.forEach((other) => {
        if (other !== item) {
        other.removeAttribute("open");
        }
    });
    }
});
});

