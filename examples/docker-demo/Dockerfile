FROM alpine:3.20

RUN apk add --no-cache openssh \
    && adduser -D -s /bin/sh fleet \
    && echo 'fleet:fleet-demo' | chpasswd \
    && ssh-keygen -A \
    && mkdir -p /run/sshd \
    && printf '%s\n' \
      'PasswordAuthentication yes' \
      'PermitRootLogin no' \
      'AllowUsers fleet' \
      >> /etc/ssh/sshd_config

EXPOSE 22

CMD ["/usr/sbin/sshd", "-D", "-e"]
