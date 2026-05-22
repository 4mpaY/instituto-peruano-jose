
export interface OrderEmailData {
  platformName: string;
  customerName: string;
  orderNumber: string | number;
  date: string;
  total: string | number;
  moneda: string;
  metodoPago: string;
  cursos: { titulo: string; precio: string | number }[];
  appUrl: string;
}

export interface WelcomeEmailData {
  platformName: string;
  customerName: string;
  correo: string;
  contrasena: string;
  appUrl: string;
}

export interface OTPEmailData {
  platformName: string;
  customerName: string;
  codigo: string;
  appUrl: string;
}

export const getOrderConfirmationTemplate = (data: OrderEmailData) => {
  const { platformName, customerName, orderNumber, date, total, moneda, metodoPago, cursos, appUrl } = data;
  
  const primaryColor = '#25927F';
  const secondaryColor = '#f9f9f9';
  
  const cursosHtml = cursos.map(curso => `
    <tr>
      <td style="padding: 12px 0; border-bottom: 1px solid #eee;">
        <span style="display: block; font-weight: 600; color: #333;">${curso.titulo}</span>
      </td>
      <td style="padding: 12px 0; border-bottom: 1px solid #eee; text-align: right; color: #666;">
        ${moneda} ${Number(curso.precio).toFixed(2)}
      </td>
    </tr>
  `).join('');

  return `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; background-color: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05); border: 1px solid #eee;">
      <!-- Header -->
      <div style="background-color: ${primaryColor}; padding: 30px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 24px; letter-spacing: 1px;">CONFIRMACIÓN DE PEDIDO</h1>
        <p style="color: rgba(255,255,255,0.8); margin: 10px 0 0 0; font-size: 14px;">Pedido #${orderNumber}</p>
      </div>

      <!-- Content -->
      <div style="padding: 40px 30px;">
        <h2 style="color: #333; margin-top: 0;">¡Hola, ${customerName}!</h2>
        <p style="color: #666; line-height: 1.6;">Gracias por tu interés en seguir aprendiendo con nosotros. Hemos recibido tu pedido y estamos procesándolo.</p>

        <!-- Order Summary Box -->
        <div style="background-color: ${secondaryColor}; border-radius: 8px; padding: 20px; margin: 25px 0;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding-bottom: 10px; color: #888; font-size: 12px; text-transform: uppercase;">Fecha</td>
              <td style="padding-bottom: 10px; color: #888; font-size: 12px; text-transform: uppercase; text-align: right;">Método de Pago</td>
            </tr>
            <tr>
              <td style="font-weight: 600; color: #333;">${date}</td>
              <td style="font-weight: 600; color: #333; text-align: right;">${metodoPago}</td>
            </tr>
          </table>
        </div>

        <!-- Items Table -->
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px;">
          <thead>
            <tr>
              <th style="text-align: left; padding-bottom: 10px; border-bottom: 2px solid #eee; color: #888; font-size: 12px; text-transform: uppercase;">Curso</th>
              <th style="text-align: right; padding-bottom: 10px; border-bottom: 2px solid #eee; color: #888; font-size: 12px; text-transform: uppercase;">Precio</th>
            </tr>
          </thead>
          <tbody>
            ${cursosHtml}
          </tbody>
          <tfoot>
            <tr>
              <td style="padding-top: 20px; font-weight: 700; color: #333; font-size: 18px;">Total</td>
              <td style="padding-top: 20px; font-weight: 700; color: ${primaryColor}; font-size: 22px; text-align: right;">
                ${moneda} ${Number(total).toFixed(2)}
              </td>
            </tr>
          </tfoot>
        </table>

        <!-- Action Button -->
        <div style="text-align: center; margin-top: 40px;">
          <a href="${appUrl}/mi-perfil/pedidos" style="background-color: ${primaryColor}; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: 700; display: inline-block; box-shadow: 0 4px 10px rgba(37, 146, 127, 0.3);">
            VER MIS PEDIDOS
          </a>
        </div>
      </div>

      <!-- Footer -->
      <div style="background-color: #f4f4f4; padding: 20px; text-align: center; border-top: 1px solid #eee;">
        <p style="margin: 0; color: #999; font-size: 12px;">&copy; ${new Date().getFullYear()} ${platformName}. Todos los derechos reservados.</p>
        <p style="margin: 5px 0 0 0; color: #999; font-size: 12px;">${appUrl.replace(/https?:\/\//, '')}</p>
        <p style="margin: 5px 0 0 0; color: #999; font-size: 12px;">Si tienes alguna duda, contáctanos a través de nuestro soporte.</p>
      </div>
    </div>
  `;
};

export const getWelcomeTemplate = (data: WelcomeEmailData) => {
  const { platformName, customerName, correo, contrasena, appUrl } = data;
  const primaryColor = '#25927F';
  const secondaryColor = '#f9f9f9';

  return `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; background-color: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05); border: 1px solid #eee;">
      <!-- Header -->
      <div style="background-color: ${primaryColor}; padding: 30px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 24px; letter-spacing: 1px;">¡BIENVENIDO A BORDO!</h1>
      </div>

      <!-- Content -->
      <div style="padding: 40px 30px;">
        <h2 style="color: #333; margin-top: 0;">¡Hola, ${customerName}!</h2>
        <p style="color: #666; line-height: 1.6;">Tu cuenta en <strong>${platformName}</strong> ha sido creada exitosamente. Estamos muy emocionados de tenerte con nosotros.</p>

        <!-- Credentials Box -->
        <div style="background-color: ${secondaryColor}; border-radius: 8px; padding: 25px; margin: 25px 0; border-left: 4px solid ${primaryColor};">
          <p style="margin: 0 0 10px 0; color: #888; font-size: 12px; text-transform: uppercase; font-weight: bold;">Tus credenciales de acceso</p>
          <p style="margin: 5px 0; color: #333;"><strong>Usuario:</strong> ${correo}</p>
          <p style="margin: 5px 0; color: #333;"><strong>Contraseña:</strong> ${contrasena}</p>
        </div>

        <p style="color: #666; font-size: 14px; line-height: 1.6;">Por seguridad, te recomendamos cambiar tu contraseña una vez que hayas iniciado sesión por primera vez.</p>

        <!-- Action Button -->
        <div style="text-align: center; margin-top: 40px;">
          <a href="${appUrl}/login" style="background-color: ${primaryColor}; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: 700; display: inline-block; box-shadow: 0 4px 10px rgba(37, 146, 127, 0.3);">
            INICIAR SESIÓN AHORA
          </a>
        </div>
      </div>

      <!-- Footer -->
      <div style="background-color: #f4f4f4; padding: 20px; text-align: center; border-top: 1px solid #eee;">
        <p style="margin: 0; color: #999; font-size: 12px;">&copy; ${new Date().getFullYear()} ${platformName}. Todos los derechos reservados.</p>
        <p style="margin: 5px 0 0 0; color: #999; font-size: 12px;">${appUrl.replace(/https?:\/\//, '')}</p>
      </div>
    </div>
  `;
};

export const getOTPTemplate = (data: OTPEmailData) => {
  const { platformName, customerName, codigo, appUrl } = data;
  const primaryColor = '#25927F';
  const secondaryColor = '#f9f9f9';

  return `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 500px; margin: auto; background-color: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05); border: 1px solid #eee;">
      <!-- Header -->
      <div style="background-color: ${primaryColor}; padding: 25px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 20px; letter-spacing: 1px;">RECUPERACIÓN DE CUENTA</h1>
      </div>

      <!-- Content -->
      <div style="padding: 35px 25px;">
        <h2 style="color: #333; margin-top: 0;">Hola, ${customerName}</h2>
        <p style="color: #666; line-height: 1.6;">Has solicitado restablecer tu contraseña. Utiliza el siguiente código de verificación para continuar con el proceso:</p>

        <!-- OTP Box -->
        <div style="text-align: center; margin: 35px 0;">
          <div style="display: inline-block; background-color: ${secondaryColor}; border: 2px dashed ${primaryColor}; border-radius: 10px; padding: 20px 40px;">
            <span style="font-size: 36px; font-weight: 900; letter-spacing: 8px; color: ${primaryColor};">
              ${codigo}
            </span>
          </div>
        </div>

        <p style="color: #666; font-size: 14px; line-height: 1.6; text-align: center;">
          Este código expirará en <strong>15 minutos</strong>.<br>
          Si no solicitaste este cambio, puedes ignorar este correo de forma segura.
        </p>
      </div>

      <!-- Footer -->
      <div style="background-color: #f4f4f4; padding: 20px; text-align: center; border-top: 1px solid #eee;">
        <p style="margin: 0; color: #999; font-size: 12px;">&copy; ${new Date().getFullYear()} ${platformName}.</p>
        <p style="margin: 5px 0 0 0; color: #999; font-size: 12px;">${appUrl.replace(/https?:\/\//, '')}</p>
      </div>
    </div>
  `;
};
