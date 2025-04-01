export const showText = (element: string, msg: string): void => {
    const el = document.querySelector(element);
    if (el) {
        el.innerHTML = msg;
    }
};