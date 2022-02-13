window.document.addEventListener('DOMContentLoaded', () => {

    async function connect(gamertag, password) {
        const headers = new Headers();
        headers.append('Content-Type', 'application.json');

        const options = {
            method: 'POST',
            mode: 'cors',
            body: JSON.stringify({
                gamertag,
                password
            }),
            headers    
            };
            const response = await fetch('https://localhost/squid/login', options);
            return response.json()
        };



        const tokens = await connect(gamertag, password);

        localStorage.setItem('token', JSON.stringify(tokens));











})
