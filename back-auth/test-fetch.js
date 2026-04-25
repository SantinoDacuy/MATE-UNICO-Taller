async function testApi() {
    try {
        console.log("Seeding user...");
        const resSeed = await fetch('http://localhost:3001/debug/seed_user', { method: 'POST' });
        const cookie = resSeed.headers.get('set-cookie');
        console.log("Cookie:", cookie);

        const url = 'http://localhost:3001/api/reviews/can-review?productId=ewhegeb0ajv15i2cwfb4mzcj&productName=Mate%20Camionero%20%22Le%C3%B3n%22&productType=producto';
        console.log("Fetching:", url);
        const res = await fetch(url, { headers: { 'Cookie': cookie }});
        const text = await res.text();
        console.log("Response can-review:", res.status, text);

        const url2 = 'http://localhost:3001/api/reviews?productId=ewhegeb0ajv15i2cwfb4mzcj&productName=Mate%20Camionero%20%22Le%C3%B3n%22&productType=producto';
        console.log("Fetching:", url2);
        const res2 = await fetch(url2, { headers: { 'Cookie': cookie }});
        const text2 = await res2.text();
        console.log("Response reviews:", res2.status, text2);
    } catch(e) {
        console.error(e);
    }
}
testApi();
