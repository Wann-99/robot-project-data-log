const groupOrder: Record<string, number> = {
  Time: 0,
  Node: 1,
  Cart: 2,
  Jnt: 3,
  GravityTorque: 4,
  Torque: 5,
  Wrench: 6,
  Motor: 7,
  MCU: 8,
  Link: 9,
  Raw: 10,
  Manipulability: 11,
  Other: 99,
};

function axis6(i: number) {
  const labels = ["X", "Y", "Z", "RX", "RY", "RZ"] as const;
  return labels[i] ?? String(i);
}

function wrench6(i: number) {
  const labels = ["Fx", "Fy", "Fz", "Tx", "Ty", "Tz"] as const;
  return labels[i] ?? String(i);
}

export type ColumnMeta = {
  name: string;
  group: string;
  groupOrder: number;
  label: string;
  unit?: string;
  description?: string;
};

export function inferColumnMeta(name: string): ColumnMeta {
  if (name === "ProgramTime") {
    return { name, group: "Time", groupOrder: groupOrder.Time, label: "ProgramTime", unit: "s/ms", description: "程序时间轴" };
  }
  if (name === "PlanTime") {
    return { name, group: "Time", groupOrder: groupOrder.Time, label: "PlanTime", unit: "s", description: "规划周期/时间" };
  }
  if (name === "NodeTime") {
    return { name, group: "Time", groupOrder: groupOrder.Time, label: "NodeTime", unit: "s", description: "节点耗时/周期" };
  }
  if (["NodeName", "NodePath", "PTName", "SubNodePTName", "ToolName"].includes(name)) {
    return { name, group: "Node", groupOrder: groupOrder.Node, label: name, description: "节点/任务信息（字符串）" };
  }

  const cart = /^Cart(\d+)(CurPos|CurVel|DesiredPos|DesiredVel|PosErr|VelErr)$/.exec(name);
  if (cart) {
    const idx = Number(cart[1]);
    const kind = cart[2];
    const axis = axis6(idx);
    const isPos = kind.includes("Pos") || kind.includes("PosErr");
    const unit = idx <= 2 ? (kind.includes("Vel") ? "m/s" : "m") : kind.includes("Vel") ? "rad/s" : "rad";
    const label = `Cart.${axis}.${kind}`;
    const description = isPos ? "笛卡尔位姿分量" : "笛卡尔速度分量";
    return { name, group: "Cart", groupOrder: groupOrder.Cart, label, unit, description };
  }

  const jnt = /^Jnt(\d+)(CurPos|CurVel|CurAcc|PosCmd|VelCmd|AccCmd|FdPosCmd|FdVelCmd|FdAccCmd|PDVelCmd|PosErr|VelErr|CurTorque|TorqueCmd|TorqueFF)$/.exec(
    name,
  );
  if (jnt) {
    const j = Number(jnt[1]);
    const kind = jnt[2];
    const unit =
      kind.includes("Torque") ? "N·m" : kind.includes("Vel") ? "rad/s" : kind.includes("Acc") ? "rad/s²" : "rad";
    const label = `J${j}.${kind}`;
    return { name, group: "Jnt", groupOrder: groupOrder.Jnt, label, unit, description: "关节空间量" };
  }

  const grav = /^GravityTorque(\d+)$/.exec(name);
  if (grav) {
    const j = Number(grav[1]);
    return { name, group: "GravityTorque", groupOrder: groupOrder.GravityTorque, label: `J${j}.GravityTorque`, unit: "N·m" };
  }

  const tf = /^TorqueFricEst(\d+)$/.exec(name);
  if (tf) {
    const j = Number(tf[1]);
    return { name, group: "Torque", groupOrder: groupOrder.Torque, label: `J${j}.TorqueFricEst`, unit: "N·m", description: "摩擦力矩估计" };
  }

  const to = /^TorqueObv(\d+)$/.exec(name);
  if (to) {
    const j = Number(to[1]);
    return { name, group: "Torque", groupOrder: groupOrder.Torque, label: `J${j}.TorqueObv`, unit: "N·m", description: "力矩观测器" };
  }

  const wrench = /^Wrench(\d+)(Desired|FromJntTorque|FromSensor)$/.exec(name);
  if (wrench) {
    const idx = Number(wrench[1]);
    const src = wrench[2];
    const axis = wrench6(idx);
    const unit = idx <= 2 ? "N" : "N·m";
    const label = `${axis}.${src}`;
    return { name, group: "Wrench", groupOrder: groupOrder.Wrench, label, unit, description: "六维力/力矩" };
  }

  const motor = /^Motor(\d+)(Current|Pos|Temperature)$/.exec(name);
  if (motor) {
    const j = Number(motor[1]);
    const kind = motor[2];
    const unit = kind === "Current" ? "A" : kind === "Temperature" ? "℃" : "rad/counts";
    return { name, group: "Motor", groupOrder: groupOrder.Motor, label: `M${j}.${kind}`, unit, description: "电机/驱动侧量" };
  }

  const mcu = /^MCU(\d+)Temperature$/.exec(name);
  if (mcu) {
    const j = Number(mcu[1]);
    return { name, group: "MCU", groupOrder: groupOrder.MCU, label: `MCU${j}.Temperature`, unit: "℃" };
  }

  const link = /^Link(\d+)Pos$/.exec(name);
  if (link) {
    const j = Number(link[1]);
    return { name, group: "Link", groupOrder: groupOrder.Link, label: `Link${j}.Pos`, unit: "rad", description: "链节/关节位置" };
  }

  const hall = /^HallRawData(\d+)FromSensor$/.exec(name);
  if (hall) {
    const i = Number(hall[1]);
    return { name, group: "Raw", groupOrder: groupOrder.Raw, label: `Hall${i}.Raw`, unit: "counts", description: "霍尔原始数据" };
  }

  const raw = /^RawData(\d+)FromSensor$/.exec(name);
  if (raw) {
    const i = Number(raw[1]);
    return { name, group: "Raw", groupOrder: groupOrder.Raw, label: `Raw${i}.FromSensor`, unit: "counts", description: "原始传感器通道" };
  }

  const mani = /^Manipulability(\d+)(ValueOri|ValueTrans)$/.exec(name);
  if (mani) {
    const i = Number(mani[1]);
    const kind = mani[2];
    return {
      name,
      group: "Manipulability",
      groupOrder: groupOrder.Manipulability,
      label: `M${i}.${kind}`,
      description: "可操作性指标",
    };
  }

  return { name, group: "Other", groupOrder: groupOrder.Other, label: name };
}

