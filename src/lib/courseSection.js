import { prisma } from "../server/db/client";

// boolean for if the student has already submitted this quiz
export async function courseSectionExists(classId) {
    let count = await prisma.CourseSection.count({
        where: {
             id: classId,
         }
    });

    return (count !== 0);
}

export async function courseSectionName(classId) {
    const courseSection = await prisma.CourseSection.findUnique({
        where: {
             id: classId,
         }
    });
    return courseSection.name;
}

export async function courseSectionDescription(classId) {
    const courseSection = await prisma.CourseSection.findUnique({
        where: {
             id: classId,
         }
    });

    return courseSection.description;
}

// returns if a class "path" already exists
// path is the unique identifier thats used to load a specific class' game
// for example, in http://localhost/class/section1, section1 is the path
export async function pathExists(path) {
    const count = await prisma.CourseSection.count({
        where: { path }
    });
    return (count === 1);
}

export async function sectionIdExists(path) {
    const count = await prisma.CourseSection.count({
        where: { path }
    });
    return (count === 1);
}

export async function getAllCourseSections() {
    return (await prisma.CourseSection.findMany());
}

// return a javascript object so the id will be the key
export async function getAllCourseSectionsJson() {
    const courseSections = await prisma.CourseSection.findMany();

    let data = {};
    for (const section of courseSections) {
        data[section.id] = {
            name: section.name,
            description: section.description,
            path: section.path
        }
    }
    return data;
}

// update an existing course section
export async function updateCourseSection(id, newData) {
    try {
        const updatedCourseSection = await prisma.CourseSection.update({
            where: { id },
            data: newData,
        });
        return updatedCourseSection;
    } catch(error) {
        console.log("Error updating course sections: ", error);
        throw error;
    }
}

// update an existing course section
export async function createCourseSection(data) {
    try {
        const newCourseSection = await prisma.CourseSection.create({data});
        return newCourseSection;
    } catch(error) {
        console.log("Error creating course sections: ", error);
        throw error;
    }
}

// update an existing course section
export async function deleteCourseSection(id) {
    try {
        const deletedSection = await prisma.CourseSection.delete({
            where: {
                id
            }
        });
        return deletedSection;
    } catch(error) {
        console.log("Error deleting course section: ", error);
        throw error;
    }
}

export async function getCourseSection(classId) {
    const list = await prisma.CourseSection.findUnique({
        where: {
             id: classId,
         }
    });
    return list;
}

