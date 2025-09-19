import onnx

onnx_model = onnx.load("api/model/best.onnx")
# 打印模型的輸出節點信息
print(onnx_model.graph.output)