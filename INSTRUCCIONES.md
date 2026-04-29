# Portal de Cotizaciones - Instrucciones de Uso

Este portal permite gestionar clientes, crear cotizaciones y seguir el flujo de documentos (OC y Facturas).

## Requisitos
- Node.js v18 o superior
- MySQL corriendo localmente (sin contraseña para el usuario root)

## Instalación y Ejecución

1. **Instalar dependencias**:
   ```bash
   npm install
   ```

2. **Configurar la base de datos**:
   Asegúrate de que MySQL esté encendido. Luego ejecuta:
   ```bash
   npx prisma db push
   ```

3. **Iniciar el servidor de desarrollo**:
   ```bash
   npm run dev
   ```

4. **Acceder al portal**:
   Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## Flujo de Trabajo
1. **Registro**: Crea una cuenta en la página de registro.
2. **Clientes**: Agrega a tus clientes en la sección "Clientes".
3. **Cotización**: Crea una nueva cotización. Puedes subir el PDF original. Se generará un folio único (ej: COT-2024-0001).
4. **Seguimiento**: Haz clic en el folio desde el dashboard para ver el detalle.
5. **Documentos**: Sube la Orden de Compra (o marca que no generó) y posteriormente la Factura (PDF y XML). El estado se actualizará automáticamente.
