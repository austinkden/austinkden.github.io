document.getElementById("button-name").addEventListener("click", function() {
    console.log("OTHER/PUBLIC-SAFETY: CLICK: 'button-name'")
    window.location.href='/';
});

document.getElementById("button-other").addEventListener("click", function() {
    console.log("OTHER/PUBLIC-SAFETY: CLICK: 'button-other'")
    window.location.href='/other';
})