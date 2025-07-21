# Supabase Edge Functions

## SendGrid Waitlist Function

This function handles waitlist signups using SendGrid for email delivery.

### Setup

1. **Set SendGrid API Key**
```bash
supabase functions secrets set SENDGRID_API_KEY="your-sendgrid-api-key"
```

2. **Set Supabase Environment Variables**
```bash
supabase functions secrets set SUPABASE_URL="your-supabase-url"
supabase functions secrets set SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
```

3. **Deploy the Function**
```bash
supabase functions deploy send-waitlist
```

### Function Details

- **Endpoint**: `send-waitlist`
- **Method**: POST
- **Body**: `{ "email": "user@example.com" }`
- **Features**:
  - Stores emails in `waitlist` table
  - Prevents duplicate signups
  - Sends confirmation email to user
  - Sends notification email to admin
  - CORS enabled for web requests

### Environment Variables Required

- `SENDGRID_API_KEY`: Your SendGrid API key
- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key

### Email Configuration

- **From Email**: tahmeed@gameshareit.com
- **Admin Email**: tahmeed@gameshareit.com
- **Email Service**: SendGrid API

### Database Schema

The function expects a `waitlist` table with:
```sql
CREATE TABLE waitlist (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
``` 