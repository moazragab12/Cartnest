FROM python:3.13-alpine

# Set the working directory
WORKDIR /app

RUN apk update && apk add --no-cache
# Copy the current directory contents into the container at /app
COPY . /app

# Install any needed packages specified in requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

EXPOSE 8000

# Define environment variable
CMD ["fastapi", "run","./app.py", "--host", "0.0.0.0", "--port", "8000"]