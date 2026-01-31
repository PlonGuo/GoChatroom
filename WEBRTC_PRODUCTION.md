# WebRTC Production Setup Guide

## Issues Fixed

The WebRTC video calling feature now works in production. The following issues were resolved:

1. ✅ **TURN Server Support**: Backend now provides TURN server credentials to clients
2. ✅ **Secure WebSocket**: Frontend automatically uses WSS (secure WebSocket) in production
3. ✅ **Dynamic ICE Server Configuration**: ICE servers are fetched from backend API
4. ✅ **HTTPS Compatibility**: Proper handling of getUserMedia() in HTTPS environments

## Environment Variables Required

### Backend (Fly.io)

Add these environment variables to your Fly.io app:

```bash
# WebRTC TURN Server Configuration
TURN_SERVER_URL=turn:turnserver.example.com:3478
TURN_USERNAME=your-turn-username
TURN_PASSWORD=your-turn-password
```

**How to set on Fly.io:**
```bash
fly secrets set TURN_SERVER_URL="turn:turnserver.example.com:3478"
fly secrets set TURN_USERNAME="your-turn-username"
fly secrets set TURN_PASSWORD="your-turn-password"
```

### Frontend (Vercel)

Update these environment variables in your Vercel project settings:

```bash
# WebSocket URL - MUST use wss:// for production
VITE_WS_URL=wss://your-backend.fly.dev

# API URL
VITE_API_URL=https://your-backend.fly.dev
```

**Note**: The frontend will automatically detect HTTPS and use WSS protocol.

## Getting Free TURN Servers

WebRTC requires TURN servers for reliable video calls when users are behind NATs/firewalls. Here are free options:

### Option 1: Metered TURN (Recommended for Testing)

1. Visit: https://www.metered.ca/tools/openrelay/
2. Use their free public TURN servers:
   ```
   TURN_SERVER_URL=turn:openrelay.metered.ca:80
   TURN_USERNAME=openrelayproject
   TURN_PASSWORD=openrelayproject
   ```

### Option 2: Twilio STUN/TURN

1. Sign up: https://www.twilio.com/stun-turn
2. Get free credentials for development

### Option 3: Self-hosted Coturn

For production, consider hosting your own TURN server using [Coturn](https://github.com/coturn/coturn).

## Testing WebRTC in Production

1. **Check WebSocket Connection**:
   - Open browser DevTools → Network → WS tab
   - Verify connection to `wss://your-backend.fly.dev/ws/rtc`
   - Should show "101 Switching Protocols"

2. **Check ICE Servers**:
   - In browser console, check for log: "Loaded ICE servers: [...]"
   - Should include both STUN and TURN servers

3. **Test Video Call**:
   - Start a call between two users
   - Grant camera/microphone permissions
   - Verify video streams appear

## Common Production Issues

### Issue: "getUserMedia() not allowed"
**Solution**: Ensure your site uses HTTPS. HTTP only works on localhost.

### Issue: WebSocket connection fails
**Solution**:
- Verify `VITE_WS_URL` uses `wss://` (not `ws://`)
- Check CORS settings on backend include your frontend domain
- Ensure Fly.io backend is running and accessible

### Issue: Video connects locally but not in production
**Solution**:
- Verify TURN server credentials are set on Fly.io
- Test TURN server connectivity: https://webrtc.github.io/samples/src/content/peerconnection/trickle-ice/
- Check firewall/security group settings

### Issue: One-way video (only one user sees video)
**Solution**:
- Both users must grant camera/microphone permissions
- Check browser console for WebRTC errors
- Verify ICE candidate exchange in Network → WS tab

## Security Notes

1. **Never commit TURN credentials** to version control
2. **Use environment variables** for all sensitive configs
3. **Rotate TURN credentials** periodically in production
4. **Monitor TURN server usage** to prevent abuse

## API Changes

New endpoint added:

**GET** `/api/v1/webrtc/ice-servers`

Returns:
```json
{
  "code": 0,
  "data": {
    "iceServers": [
      {
        "urls": ["stun:stun.l.google.com:19302"]
      },
      {
        "urls": "turn:turnserver.example.com:3478",
        "username": "user",
        "credential": "pass"
      }
    ]
  }
}
```

## Deployment Checklist

- [ ] Set `TURN_SERVER_URL`, `TURN_USERNAME`, `TURN_PASSWORD` on Fly.io
- [ ] Set `VITE_WS_URL=wss://your-backend.fly.dev` on Vercel
- [ ] Verify HTTPS is enabled on frontend (Vercel does this automatically)
- [ ] Test WebSocket connection in production
- [ ] Test video calls between two users in different networks
- [ ] Monitor browser console for WebRTC errors

## Files Changed

### Backend
- `backend/internal/handler/webrtc.go` - New ICE servers endpoint
- `backend/internal/router/router.go` - Added WebRTC route

### Frontend
- `frontend/src/api/webrtcApi.ts` - New API for fetching ICE servers
- `frontend/src/services/webrtc.ts` - Fetch ICE servers, use WSS in production
- `frontend/src/pages/Home.tsx` - Handle async WebRTC connection

### Configuration
- `.env.example` - Added TURN server documentation
