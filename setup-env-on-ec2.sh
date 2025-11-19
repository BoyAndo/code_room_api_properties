#!/bin/bash

# ========================================
# Script para crear .env en la instancia EC2
# ========================================
# Ejecuta este script EN LA INSTANCIA EC2:
# ssh -i tu-clave.pem ubuntu@tu-ip-ec2
# cd /home/ubuntu/code_room_api_properties
# nano setup-env-on-ec2.sh
# chmod +x setup-env-on-ec2.sh
# ./setup-env-on-ec2.sh

echo "🔧 Creando archivo .env para Code Room API Properties..."

# Crear archivo .env
cat > .env <<'EOF'
PORT=3002

# Database (CAMBIAR AL RDS O BASE DE DATOS DE PRODUCCIÓN)
DATABASE_URL=mysql://root:howlin404@uroom.cbmkwgi8u37x.us-east-1.rds.amazonaws.com:3306/code_room

# JWT Keys (DEBE SER EL MISMO QUE EN API_REGISTER Y FRONTEND)
JWT_SECRET=kJ8#mN9$pQ2@wE5!rT7&yU1*iO3^aS6%dF4+gH0-lK9=xC2@vB5!nM8%zQ7*wE3&

# MinIO S3 (CAMBIAR SI USAS OTRO SERVIDOR DE MinIO O AWS S3)
MINIO_ENDPOINT=http://localhost:9000
MINIO_USER=minioadmin
MINIO_PASS=minioadmin123
URL_S3=http://localhost:9000/certificados/
URL_S3_CARNETS=http://localhost:9000/carnets/
URL_S3_UTILITYBILLS=http://localhost:9000/utilitybills/
URL_S3_PROPERTY_IMAGES=http://localhost:9000/properties/
EOF

echo "✅ Archivo .env creado en $(pwd)/.env"
echo ""
echo "⚠️  IMPORTANTE: Edita el archivo y cambia los valores según tu entorno:"
echo "   nano .env"
echo ""
echo "📝 Cambia especialmente:"
echo "   - DATABASE_URL (debe apuntar a tu base de datos de producción)"
echo "   - MINIO_ENDPOINT (si MinIO está en otro servidor)"
echo "   - JWT_SECRET (DEBE ser el mismo que en api_register y frontend)"
echo ""
echo "🔒 Protege el archivo .env:"
echo "   chmod 600 .env"
echo "   chown ubuntu:ubuntu .env"
