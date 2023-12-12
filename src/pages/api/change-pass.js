import { withSessionRoute } from "@/lib/session";
import { getUsername, changePassword } from "@/lib/user"
import { validate_login } from "@/lib/user";

export default withSessionRoute(async (req, res) => {
  if (req.method === 'POST') {
    if (!req.session.user) {
        return res.status(500).json({ message: 'User not logged in' });
    }

    const username = req.session.user.username;
    const userId = parseInt(req.session.user.userId);

    const { currentPassword, newPassword, newPasswordConfirm } = req.body;

    if (newPassword !== newPasswordConfirm) {
        return res.status(500).json({ message: 'Passwords do not match' });
    }

    if (newPassword === currentPassword) {
        return res.status(500).json({ message: 'New password cannot be the same as the current pasword' });
    }

    if (newPassword.length < 8) {
      return res.status(500).json({ message: 'Password must be at least 8 characters long' });
    }
    
    if (await getUsername(userId ) !== username) {
        return res.status(500).json({ message: 'Could not find user' });
    }

    if (!(await validate_login(username, currentPassword))) {
        return res.status(500).json({ message: 'Current password is not correct' });
    }

    if (!(await changePassword(newPassword, userId))) {
        return res.status(500).json({ message: 'Unknown server error occured' });
    }

    return res.status(200).json({ success: true, message: 'Password changed successfully' });
  }
  else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
});