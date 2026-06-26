const container = document.querySelector('.container.spin');
const img = container ? container.querySelector('img') : null;

if (container && img) {
    container.addEventListener('click', () => {
        container.getAnimations().forEach(anim => anim.reverse());
        img.getAnimations().forEach(anim => anim.reverse());
    });
}
