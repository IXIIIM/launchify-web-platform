      include: {
        sender: {
          select: {
            id: true,
            entrepreneurProfile: true,
            funderProfile: true
          }
        }
      }
    });

    // Notify sender about read status
    const sender = this.clients.get(message.senderId);
    if (sender && sender.readyState === WebSocket.OPEN) {
      sender.send(JSON.stringify({
        type: 'MESSAGE_READ',
        messageId,
        conversationId: message.matchId
      }));
    }
  }

  public broadcast(notification: NotificationPayload) {
    this.wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(notification));
      }
    });
  }

  public broadcastToUserType(userType: 'entrepreneur' | 'funder', notification: NotificationPayload) {
    this.wss.clients.forEach(async (client) => {
      const ws = client as WebSocketClient;
      if (ws.userId) {
        const user = await prisma.user.findUnique({
          where: { id: ws.userId },
          select: { userType: true }
        });

        if (user && user.userType === userType && ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify(notification));
        }
      }
    });
  }
}