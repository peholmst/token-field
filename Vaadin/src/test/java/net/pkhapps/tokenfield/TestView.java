package net.pkhapps.tokenfield;

import com.vaadin.flow.component.orderedlayout.VerticalLayout;
import com.vaadin.flow.component.textfield.TextField;
import com.vaadin.flow.router.Route;

@Route("")
public class TestView extends VerticalLayout {

    public TestView() {
        TokenField<String> stringTokenField = new TokenField<>();
        stringTokenField.setItems("TokenA", "TokenB", "TokenC", "TokenD");
        stringTokenField.setNewItemHandler(TokenField::addItem);
        stringTokenField.setLabel("Token Field");
        add(stringTokenField);

        TextField textField = new TextField();
        textField.setLabel("Text Field");
        add(textField);

        TokenBubbleField<String> stringTokenBubbleField = new TokenBubbleField<>();
        stringTokenBubbleField.setLabel("Token Bubble Field");
        stringTokenBubbleField.setItems("TokenA", "TokenB", "TokenC", "TokenD");
        add(stringTokenBubbleField);
    }
}
