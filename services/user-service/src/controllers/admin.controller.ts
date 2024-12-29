import { Request, Response } from "express";
import { prisma } from "../../../../db/db";
import { logger } from "../utils/utils";

enum GroupRole {
  MEMBER,
  ADMIN,
}



// functionalities to be included for the admins of the groups
// ADD A MEMBER ACCORDING TO THEIR CHOICE
// REMOVE A MEMBER ACCORDING TO THEIR CHOICE
// MAKE THE GROUP ADMINS ONLY OR EVERYONE CAN SEND TEXTS
// MAKE THE GROUP OPEN TO ALL OR INVITE ONLY
// IF THERE IS ONLY ONE ADMIN, MAKE ANOTHER ONE ADMIN BEFORE EXITING: DONE
// DELETE A TEXT OF A MEMBER IN THE GROUP IF THE TEXT IS OFFENSIVE
// WHETHER THE GROUP SETTINGS CAN BE CHANGED BY ANY MEMBER OR BY THEM ONLY

export async function getGroup(req: Request, res: Response) {
  try {
    const { groupId } = req.query;
    const existingGroup = await prisma.group.findUnique({
      where: {
        id: Number(groupId),
      },
    });
    if (!existingGroup) {
      return res.status(404).json({
        success: false,
        msg: "Group not found",
      });
    }

    logger.info("Group found successfully", {
      action: "existing-group-search",
    });

    return res.status(200).json({
      success: true,
      msg: "Group successfully found",
      group: existingGroup,
    });
  } catch (error) {
    console.log("Error while searching for the group: ", error);

    logger.error("Error while searching for the group", {
      action: "existing-group-search",
    });
    return res.status(500).json({
      success: false,
      msg: "Internal Server Error",
    });
  }
}

export async function addMemberIntoTheGroup(req: Request, res: Response) {
  try {
    const { newMemberId, newMemberName, newMemberEmail, groupId } = req.body;
    const existingGroup = await prisma.group.findUnique({
      where: {
        id: Number(groupId),
      },
    });
    if (!existingGroup) {
      return res.status(404).json({
        success: false,
        msg: "Group not found",
      });
    }
    const newMemberInTheGroup = await prisma.member.create({
      data: {
        name: String(newMemberName),
        email: String(newMemberEmail),
        userId: Number(newMemberId),
        groupId: Number(groupId),
      },
    });

    logger.info(`New member added in the group with id ${groupId}`, {
      action: "new-member-addition",
    });

    return res.status(200).json({
      success: true,
      msg: "Member successfully added to the group",
      newMember: newMemberInTheGroup,
    });
  } catch (error) {
    console.log("Error while adding member into the group: ", error);
    logger.error("Error while adding member into the group", {
      action: "new-member-addition",
    });
    return res.status(500).json({
      success: false,
      msg: "Internal Server Error",
    });
  }
}

// function to handle the case of admin exiting the group
// in case of multiple admins
export async function adminExitGroup(req: Request, res: Response) {
  try {
    const { userId, groupId } = req.query;
    const groupToBeExited = await prisma.group.findUnique({
      where: {
        id: Number(groupId),
      },
    });
    const adminToBeExited = await prisma.member.findUnique({
      where: {
        userId_groupId: {
          userId: Number(userId),
          groupId: Number(groupId),
        },
      },
    });
    if (!groupToBeExited || !adminToBeExited) {
      logger.error(
        `Either group with id ${groupId} or admin with id ${userId} are not found`,
        {
          action: "admin-exit-handler",
        }
      );
      return res.status(404).json({
        success: false,
        msg: "Group not found",
      });
    }
    await prisma.member.delete({
      where: {
        userId_groupId: {
          userId: Number(userId),
          groupId: Number(groupId),
        },
      },
    });
    const allMembers = await prisma.member.findMany({
      where: {
        groupId: Number(groupId),
      },
    });
    await prisma.group.update({
      where: {
        id: Number(groupId),
      },
      data: {
        totalMembers: allMembers.length,
        updatedAt: new Date(Date.now()),
      },
    });

    logger.info("Admin exited successfully", {
      action: "admin-exit-handler",
    });

    return res.status(200).json({
      success: true,
      msg: "Previous Admin exited successfully",
      updatedMembers: allMembers,
    });
  } catch (error) {
    console.error("Error while exiting group: ", error);
    logger.error("Error while admin exiting the group", {
      action: "admin-exit-handler",
    });
    return res.status(500).json({
      success: false,
      msg: "Internal Server Error",
    });
  }
}

// in case of a single admin
export async function makeAdminBeforeExiting(req: Request, res: Response) {
  try {
    const { groupId, newAdminId, oldAdminId } = req.query;
    const newAdmin = await prisma.member.update({
      where: {
        userId_groupId: {
          userId: Number(newAdminId),
          groupId: Number(groupId),
        },
      },
      data: {
        role: "ADMIN",
      },
    });
    const oldAdmin = await prisma.member.update({
      where: {
        userId_groupId: {
          userId: Number(oldAdminId),
          groupId: Number(groupId),
        },
      },
      data: {
        role: "MEMBER",
      },
    });
    console.log("New Admin: ", newAdmin);
    logger.info("Admin changed successfully", {
      action: "admin-change-handler",
    });
    return res.status(201).json({
      success: true,
      msg: `Admin changes successfully`,
      oldAdmin: oldAdmin,
      newAdmin: newAdmin,
    });
  } catch (error) {
    console.error(
      "Error while making some other person admin in the server: ",
      error
    );
    logger.error("Error while changing admins", {
      action: "admin-change-handler",
    });
    return res.status(500).json({
      success: false,
      msg: "Internal Server Error",
    });
  }
}

// function to kick out a member
