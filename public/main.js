document.addEventListener('DOMContentLoaded', () => {
    const projectTitle = document.querySelector('#projectTitle');
    const sceneName = document.querySelector('#sceneName');

    // Save changes to the project title on blur
    if (projectTitle) {
        projectTitle.addEventListener('blur', async () => {
            const updatedName = projectTitle.textContent.trim();
            const projectId = projectTitle.dataset.projectId;

            if (updatedName) {
                try {
                    const response = await fetch(`/admin/project/${projectId}`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ name: updatedName }),
                    });

                    if (!response.ok) {
                        console.error('Failed to update project name');
                    }
                } catch (error) {
                    console.error('Error updating project name:', error);
                }
            }
        });
    }

    // Save changes to the scene name on blur
    if (sceneName) {
        sceneName.addEventListener('blur', async () => {
            const sceneId = sceneName.dataset.sceneId;
            const updatedName = sceneName.textContent.trim();

            if (updatedName) {
                try {
                    const response = await fetch(`/admin/project/${sceneName.dataset.projectId}/scene/${sceneId}`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ name: updatedName }),
                    });

                    if (!response.ok) {
                        throw new Error('Failed to update scene name');
                    }

                    console.log('Scene name updated successfully');
                } catch (error) {
                    console.error('Error updating scene name:', error);
                }
            }
        });
    }
});
