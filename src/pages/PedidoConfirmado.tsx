Based on the information provided, I don't have the full content of the `src/pages/PedidoConfirmado.tsx` file to reconstruct it completely. The AI's response only mentioned making changes to how the bar properties are accessed, but didn't provide the full file content.

The AI suggested changing code patterns like:
```
barName: pedido?.bar_data?.name || "Bar",
barAddress: pedido?.bar_data?.address || "Endereço do bar",
```

to:
```
barName: pedido?.bar_data ? pedido.bar_data.name : "Bar",
barAddress: pedido?.bar_data ? pedido.bar_data.address : "Endereço do bar",
```

However, without seeing the complete file, I cannot provide the full code with these changes properly integrated. The AI didn't include the full content of this file in its response, only suggesting the pattern changes.

To properly help you, I would need to see the original content of the `src/pages/PedidoConfirmado.tsx` file.
