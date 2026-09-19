package pe.edu.utec.vetcare.entity;

import jakarta.persistence.*;
import lombok.*;

@AllArgsConstructor
@NoArgsConstructor
@Data
@Entity
@Table(name = "veterinario")
public class VeterinarioEntity {

    /*@OneToOne
    @JoinColumn(name = "id_usuario")
    private UsuarioEntity usuario;
    */

    // PROVISIONAL
    @Column(name = "id_usuario")
    private Integer idUsuario;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_veterinario")
    private Integer idVeterinario;

    @Column(name = "especialidad")
    private String especialidad;

    @Column(name = "nro_colegiatura")
    private String nroColegiatura;
}