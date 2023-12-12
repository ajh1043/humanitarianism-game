import { withSessionRoute } from "@/lib/session";
import { getAllCourseSections, getAllCourseSectionsJson, updateCourseSection, 
    createCourseSection, deleteCourseSection, pathExists} from "@/lib/courseSection"
import { deleteAllStats, createSectionStats } from "@/lib/stats";

// make sure the path will be valid for the URL
// full url will look http://localhost/class/section-1
// path will just be "section-1"
function pathIsValid (path) {
  if (path === "") {
    return false;
  }
  // Only allow a-z, A-Z, 0-9 and dashes
  const isValid = /^[a-zA-Z0-9-]*$/.test(path);
  return isValid;
}

export default withSessionRoute(async (req, res) => {
  if (req.method === 'POST') {
    if (!req.session.user) {
        return res.status(500).json({ message: 'User not logged in' });
    }
    const sections = req.body.sections;
    // get the current list of sections so we know if we need to delete, add new ones, or update existing
    const dbSections = await getAllCourseSectionsJson();

    // make sure all the values are valid before writing to db
    // sections.map(async (section) => {
    //     if (!pathIsValid(section.path)) {
    //         return res.status(500).json({ message: `Path "${section.path}" is invalid. Allowed characters are a-z, A-Z, 0-9 and -` });
    //     }

    //     var pathExists = false;
    //     sections.map(async (tmp) => {

    //     });
        // console.log("await pathExists(section.path): ", await pathExists(section.path));
        // if (!(section.id !== )) {
        //     console.log("TRUE")
        //     if ((await pathExists(section.path))) {

        //         return res.status(500).json({ message: `Path "${section.path}" already exists. This must be unique.` });
        //     }
        // }
    // });

    sections.map(async (section) => {
        // does this section already exist
        if (section.id in dbSections) {
            // update existing record
            const updatedData = {
                name: section.name,
                description: section.description,
                //path: section.path,
            };
            // does the record actually need to be updated?
            if (JSON.stringify(updatedData) !== JSON.stringify(dbSections[section.id])) {
                try {
                    await updateCourseSection(section.id, updatedData);
                } catch(error) {
                    return res.status(500).json({ message: `Error updating course section "${section.name}"` });
                }
            }
        }
        // create a new course
        else {
            const newData = {
                name: section.name,
                description: section.description,
                //path: section.path,
            };
            try {
                const newCourseSection = await createCourseSection(newData);
                await createSectionStats(newCourseSection.id);
            } catch(error) {
                return res.status(500).json({ message: `Error updating course section "${section.name}"` });
            }
        }
    });

    // loop through db section and see if one exists in db but not in updated sections data
    // if so, delete it from the db
    
    Object.keys(dbSections).map(id => {
        var found = false;
        sections.map(section => {
            if (section.id === parseInt(id)) {
                found = true;
            }
        });
        if (!found) {
            // delete from course sections table
            try {
                deleteAllStats(parseInt(id));
                deleteCourseSection(parseInt(id));
            } catch(error) {
                return res.status(500).json({ message: `Error deleting course section "${dbSections[id].name}"` });
            }
        }
    });

    // get the latest course sections to send back
    const updatedSections = await getAllCourseSections();

    return res.status(200).json({ success: true, message: 'Class sections updated'});
  }
});