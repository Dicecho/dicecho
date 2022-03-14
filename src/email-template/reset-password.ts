export const resetPassword = `
  <div
    class="es-content-body"
    style="background-color: #283241; color: rgba(255, 255, 255, 0.65); padding: 32px;"
    width="600"
    cellspacing="0"
    cellpadding="0"
    align="center"
  >
  <div
    class="esd-block-image es-p5t es-p5b"
    align="center"
    style="font-size: 0px; padding: 5px 0px;"
  >
    <img
      src="https://dicetower.oss-cn-heyuan.aliyuncs.com/images/logo.png"
      alt
      style="display: block;"
      width="175"
    />
  </div>

  <div class="esd-block-text" align="center" style="padding-top: 15px; padding-bottom: 15px;">
    <h1 style="color: #fff; font-size: 20px;">
      <b>忘记密码了？</b>
    </h1>
  </div>

  <div
    class="esd-block-text"
    style="padding-top: 25px; padding-right: 40px; padding-left: 40px;"
    align="center"
  >
    <p>
      Hi,<%= nickcname %>
      请在15分钟内点击下方的链接来重置您的密码，如果您没有做过相关的操作请忽视这封邮件
    </p>
  </div>

    <div
      class="esd-block-button"
      style="padding: 40px 10px;"
      align="center"
    >
      <span
        class="es-button-border es-button-border-1615565126948"
        style="border-color: #9396f7; border: 1px solid #9396f7; padding: 8px 16px; border-radius: 5px;"
        ><a
          href="<%= link %>"
          class="es-button"
          target="_blank"
          style="color: #9396f7; text-decoration: none;"
          >重置密码</a
        ></span
      >
    </div>

    <div
     style="width: 100%; display: flex; align-items: center; justify-content: center;"
    >
      <p style="font-size: 14px;">
        联系我们:
        <a
          target="_blank"
          href="painterpuppets@dicecho.com"
          style="font-size: 14px; color: #fff;"
          >painterpuppets@dicecho.com</a
        >
      </p>
    </div>
  </div>
`;
