# import os
# import spaces
# import gradio as gr
# from django.core.wsgi import get_wsgi_application

# os.environ.setdefault("DJANGO_SETTINGS_MODULE", "smart_crm.settings")
# os.system("python manage.py migrate --noinput")

# django_app = get_wsgi_application()

# @spaces.GPU
# def health_check():
#     return "SmartBillingCRM API & EasyOCR Engine Running!"

# with gr.Blocks() as demo:
#     gr.Markdown("# SmartBillingCRM Backend API")
#     btn = gr.Button("Check API Status")
#     out = gr.Textbox(label="Status")
#     btn.click(health_check, outputs=out)

# app = gr.mount_gradio_app(django_app, demo, path="/gradio")

# if __name__ == "__main__":
#     import uvicorn
#     uvicorn.run(app, host="0.0.0.0", port=7860)
