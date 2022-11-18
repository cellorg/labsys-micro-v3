FROM --platform=linux/amd64 amazoncorretto:17
ARG PORT=8080
COPY target/microa-0.0.1-SNAPSHOT.jar app.jar
EXPOSE $PORT
ENTRYPOINT ["java","-jar","/app.jar"]