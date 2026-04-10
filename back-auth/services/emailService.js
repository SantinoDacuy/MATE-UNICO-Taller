const nodemailer = require('nodemailer');
const path = require('path');

// Creamos el transporter usando exactamente las variables de tu .env
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: process.env.EMAIL_PORT || 587,
    secure: process.env.EMAIL_SECURE === 'true', // true para 465, false para otros puertos
    auth: {
        user: process.env.EMAIL_USER, // santinodacuy@gmail.com
        pass: process.env.EMAIL_PASSWORD  // inrerphijwfboeqqr
    }
});

/**
 * Función para enviar el comprobante de pago al cliente.
 * 
 * @param {Object} userData - Información del usuario { nombre, email }
 * @param {Object} orderDetails - Detalles de la orden { id, total, items }
 */
const sendOrderConfirmation = async (userData, orderDetails) => {
    try {
        // Validación básica
        if (!userData || !userData.email) {
            console.error("No se proporcionó un email válido para enviar el comprobante.");
            return;
        }

        // Construir la lista de artículos para el HTML
        let itemsHtml = '';
        if (orderDetails.items && orderDetails.items.length > 0) {
            orderDetails.items.forEach(item => {
                itemsHtml += `
                    <tr>
                        <td style="padding: 10px; border-bottom: 1px solid #ebf0f5; color: #4a5568;">
                            ${item.cantidad}x ${item.nombre}
                        </td>
                        <td style="padding: 10px; border-bottom: 1px solid #ebf0f5; text-align: right; color: #4a5568; font-weight: bold;">
                            $${item.subtotal.toLocaleString('es-AR')}
                        </td>
                    </tr>
                `;
            });
        }

        const mailOptions = {
            from: `"Mate Único" <${process.env.EMAIL_USER}>`,
            to: userData.email,
            subject: `¡Pago Seguro Aprobado! Tu pedido #${orderDetails.id} ya está en marcha 🧉`,
            html: `
                <div style="font-family: 'Inter', 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 0; background-color: #fcfcfc; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.05); border: 1px solid #eaeaea;">
                    
                    <!-- Header con el Logo -->
                    <div style="background-color: #1a1a1a; padding: 30px; text-align: center; border-bottom: 4px solid #cc9966;">
                        <img src="cid:logo_mate_unico" alt="Mate Único Logo" style="max-height: 80px; width: auto; margin-bottom: 10px;" />
                        <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 500; letter-spacing: 1px;">Confirmación de Pago Segura</h1>
                    </div>
                    
                    <div style="background-color: #ffffff; padding: 40px;">
                        <!-- Saludo Cálido -->
                        <h2 style="color: #2d3748; font-size: 22px; margin-top: 0;">¡Hola, ${userData.nombre}! 👋</h2>
                        
                        <p style="color: #4a5568; font-size: 16px; line-height: 1.6; margin-bottom: 25px;">
                            Nos alegra muchísimo confirmarte que tu pago a través de Mercado Pago ha sido <strong>aprobado con éxito</strong>. Ya comenzamos a preparar tu pedido con toda la dedicación y el cuidado artesanal que se merece.
                        </p>

                        <!-- Mensaje de Seguridad -->
                        <div style="background-color: #f7fafc; border-left: 4px solid #48bb78; padding: 15px 20px; border-radius: 4px; margin-bottom: 30px;">
                            <p style="margin: 0; color: #2f855a; font-size: 15px; font-weight: 500;">
                                🔒 Este correo es tu comprobante oficial de compra y garantía de que tu pedido está en excelentes manos.
                            </p>
                        </div>
                        
                        <!-- Tabla del Pedido -->
                        <div style="border: 1px solid #e2e8f0; border-radius: 10px; overflow: hidden; margin-bottom: 30px;">
                            <div style="background-color: #f8fafc; padding: 15px 20px; font-weight: 600; color: #1a202c; border-bottom: 1px solid #e2e8f0; text-transform: uppercase; font-size: 14px; letter-spacing: 0.5px;">
                                Resumen de tu pedido #${orderDetails.id}
                            </div>
                            <table style="width: 100%; border-collapse: collapse; background-color: #ffffff;">
                                <tbody>
                                    ${itemsHtml}
                                </tbody>
                                <tfoot>
                                    <tr style="background-color: #f8fafc;">
                                        <td style="padding: 20px; text-align: right; font-weight: 600; color: #4a5568; font-size: 15px;">
                                            TOTAL PAGADO
                                        </td>
                                        <td style="padding: 20px; text-align: right; font-weight: 700; color: #cc9966; font-size: 20px;">
                                            $${orderDetails.total.toLocaleString('es-AR')}
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>

                        <!-- Próximos pasos -->
                        <h3 style="color: #2d3748; font-size: 18px; margin-bottom: 15px;">¿Qué sigue ahora?</h3>
                        <p style="color: #4a5568; font-size: 15px; line-height: 1.6; margin-bottom: 30px;">
                            Estamos embalando todo para asegurar que llegue en perfectas condiciones. Muy pronto te enviaremos otro correo con la información de tu envío para que puedas seguir el recorrido de tu mate.
                        </p>

                        <!-- Despedida y Soporte -->
                        <div style="text-align: center; border-top: 1px solid #e2e8f0; padding-top: 30px;">
                            <p style="color: #718096; font-size: 14px; margin-bottom: 5px;">
                                Si tenés alguna consulta, no dudes en responder a este correo.
                            </p>
                            <p style="color: #cc9966; font-size: 16px; font-weight: 600; margin: 10px 0 0 0;">
                                ¡Gracias por elegir Mate Único! 🧉
                            </p>
                        </div>
                    </div>
                </div>
            `,
            attachments: [
                {
                    filename: 'logo.png',
                    path: path.join(__dirname, '../../front/src/assets/logo.png'),
                    cid: 'logo_mate_unico' // Mismo cid que en el src del img
                }
            ]
        };

        // Enviar el correo electrónico
        await transporter.sendMail(mailOptions);
        console.log(`Email enviado a ${userData.email}`);
    } catch (error) {
        console.error("Error al enviar el comprobante de pago por email:", error);
    }
};

module.exports = {
    sendOrderConfirmation
};
