document.addEventListener('DOMContentLoaded', () => {
    const createReviewForm = document.getElementById('create-review-form');
    const viewReviewForm = document.getElementById('view-review-form');
    const usernameInput = document.getElementById('username');

    viewReviewForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const reviewName = document.getElementById('view-review-name').value.trim();
        const password = document.getElementById('view-review-password').value.trim();
        const username = usernameInput.value.trim();
        
        if (!username) {
            alert('Please enter your name');
            return;
        }

        console.log(`Attempting to view review with name: ${reviewName}, password: ${password}, username: ${username}`);

        // Store review name and password in localStorage to access in review page
        localStorage.setItem('reviewName', reviewName);
        localStorage.setItem('reviewPassword', password);
        localStorage.setItem('username', username);

        // Redirect to the review page
        window.location.href = '/review';
    });
});
