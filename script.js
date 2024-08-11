document.querySelector('.namebar').addEventListener('click', function() {
    this.classList.toggle('active');
  });

   document.querySelector('.namebar').addEventListener('click', function() {
    setTimeout(function() {
      window.location.href = 'https://austinkden.github.io/ex';
    }, 500); // 500 milliseconds delay
  });