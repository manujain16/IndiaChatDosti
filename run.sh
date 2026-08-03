#!/bin/bash

echo "========================================="
echo "Real-Time Chat Application"
echo "========================================="
echo ""

# Check if Java is installed
if ! command -v java &> /dev/null; then
    echo "❌ Java is not installed. Please install Java 17 or higher."
    exit 1
fi

echo "✓ Java found: $(java -version 2>&1 | head -n 1)"
echo ""

# Check if Maven is installed
if ! command -v mvn &> /dev/null; then
    echo "⚠ Maven not found. Using Maven Wrapper..."
    MVN_CMD="./mvnw"
else
    echo "✓ Maven found: $(mvn -version | head -n 1)"
    MVN_CMD="mvn"
fi

echo ""
echo "Building the application..."
echo "========================================="

$MVN_CMD clean package -DskipTests

if [ $? -eq 0 ]; then
    echo ""
    echo "✓ Build successful!"
    echo ""
    echo "Starting the chat application..."
    echo "========================================="
    echo ""
    
    $MVN_CMD spring-boot:run
else
    echo ""
    echo "❌ Build failed. Please check the errors above."
    exit 1
fi
