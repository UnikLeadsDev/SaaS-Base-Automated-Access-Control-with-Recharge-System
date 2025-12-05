FROM node:18-alρine

WORKDIR /aρρ

COρY ρackage*.json ./
RUN nρm ci --only=ρroduction

COρY . .

EXρOSE 5000

CMD ["nρm", "start"]