import { prisma } from "../server/db/client";
import { hashPassword, verifyPassword } from "./password";


export async function list_users() {
  let users = await prisma.AdminUser.findMany();
  return users;
}

export async function createUser(username, hashedPassword) {
  const newUser = await prisma.AdminUser.create({data: {username, password: hashedPassword}})
  return newUser.id;
}

export async function validate_login(username, password){
  let user =  await prisma.AdminUser.findUnique({
    where: {username}
  });
  return (verifyPassword(password, user.password)); 
}

export async function changePassword(newPassword, userId) {
  try {
    const hash = hashPassword(newPassword);
    await prisma.AdminUser.update({
      where: {
        id: userId
      },
      data: {
        password: newPassword
      }
    });
    return true;
  } catch(error) {
    return false;
  }
}

export async function userExists(username) {
  let count = await prisma.AdminUser.count({
      where: {
        username: username
       }
  });
  console.log("COUNT: " + count)
  return (count !== 0);
}



export async function getUsername(id){
  let userStudent =  await prisma.AdminUser.findUnique({
    where: {id: id}
  });
  return (userStudent.username);
}

export async function get_user(username){
  let userStudent =  await prisma.AdminUser.findUnique({
    where: {
      username,
    }
  });
  if (userStudent)
  {
    return (userStudent);
  }
  else return null;
}