document.addEventListener('DOMContentLoaded', () => {
    console.log("Hello I loaded preview.js")
    const socket = io();

    socket.on('elementUpdated', (updatedElement) => {
        console.log('Element updated:', updatedElement);
        // Ensure updatedElement has the required properties
        if (!updatedElement || !updatedElement.position || !updatedElement.type) {
            console.error('Invalid element data received:', updatedElement);
            return;
        }

        const previewArea = document.getElementById('previewArea');
        if (!previewArea) {
            console.error('Preview area not found in the DOM');
            return;
        }

        const elementDiv = document.querySelector(`[data-element-id="${updatedElement._id}"]`);
        if (elementDiv) {
            // Update existing element
            elementDiv.style.top = `${updatedElement.position.y}px`;
            elementDiv.style.left = `${updatedElement.position.x}px`;
            elementDiv.style.transform = `scale(${updatedElement.position.scale / 100}) rotate(${updatedElement.position.rotate}deg)`;

            if (updatedElement.type === 'text') {
                const textElement = elementDiv.querySelector('.element-text');
                if (textElement) textElement.textContent = updatedElement.content;
            } else if (updatedElement.type === 'image') {
                const imageElement = elementDiv.querySelector('.element-image');
                if (imageElement) imageElement.src = updatedElement.content;
            }
        } else {
            // Add new element if it doesn't exist
            const newElement = document.createElement('div');
            newElement.classList.add('absolute', 'element');
            newElement.setAttribute('data-element-id', updatedElement._id);

            // Assign styles dynamically
            newElement.style.top = `${updatedElement.position.y}px`;
            newElement.style.left = `${updatedElement.position.x}px`;
            newElement.style.transform = `scale(${updatedElement.position.scale / 100}) rotate(${updatedElement.position.rotate}deg)`;

            // Set element content based on its type
            if (updatedElement.type === 'text') {
                newElement.innerHTML = `
                    <p class="element-text" style="color: ${updatedElement.theme?.color || '#FFFFFF'}">
                        ${updatedElement.content}
                    </p>`;
            } else if (updatedElement.type === 'image') {
                newElement.innerHTML = `
                    <img src="${updatedElement.content}" alt="Element Image" class="element-image" />`;
            }

            // Append the new element to the preview area
            previewArea.appendChild(newElement);
        }
    });
});
