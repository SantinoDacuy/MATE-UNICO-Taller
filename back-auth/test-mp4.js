const { MercadoPagoConfig, Preference } = require('mercadopago');

const clientMP = new MercadoPagoConfig({ accessToken: 'APP_USR-5631689191170396-032617-2f2dfd02b5482aacd69951ec962b23cf-3295571686' });

async function run() {
    try {
        const preferenceClient = new Preference(clientMP);
        const preferenceResponse = await preferenceClient.create({
            body: {
                items: [{ title: 'test', unit_price: 100, quantity: 1 }],
                external_reference: "123",
                back_urls: {
                    success: "https://httpbin.org/redirect-to?url=http://localhost:5173/final",
                    failure: "https://httpbin.org/redirect-to?url=http://localhost:5173/pago-tarjeta",
                    pending: "https://httpbin.org/redirect-to?url=http://localhost:5173/pago-tarjeta"
                },
                auto_return: "approved"
            }
        });
        console.log("SUCCESS:", preferenceResponse.init_point);
    } catch (e) {
        console.error("ERROR:");
        console.error(e.message || e);
    }
}

run();
