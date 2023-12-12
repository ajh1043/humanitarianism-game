import { withSessionRoute } from "@/lib/session";
import { resetAllStats } from "@/lib/stats"

export default withSessionRoute(async (req, res) => {
    if (req.method === 'POST') {
      if (!req.session.user) {
          return res.status(500).json({ message: 'User not logged in' });
      }

      
      if (req.body.courseSectionId) {
        console.log("resetting stats");  
        try {
            resetAllStats(req.body.courseSectionID);
            return res.status(200).json({message: 'Stats successfully reset' });
        } catch (error) {
            return res.status(500).json({ message: `Unknown error occured while resetting stats` });
        }
      }
    }
});